import bcrypt from "bcrypt";
import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import mysql from "mysql";
import jwt from "jsonwebtoken";
// "multer" pentru upload imagini
import multer from "multer";
import fs from "fs";
import rateLimit from "express-rate-limit";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, "../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Tip de fișier neacceptat."));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 8000;
const SERVER_START_TIME = Math.floor(Date.now() / 1000);

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "loyaltyCards",
});

con.connect(function (err) {
  if (err) {
    console.error("Eroare la conectare: " + err.message);
    return;
  }
  console.log("Conectat cu succes la baza de date MySQL!");
});

app.use(cors());
app.use(express.json());

// Middleware verificare token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

  if (!token) {
    return res
      .status(403)
      .json({ mesaj: "Acces interzis. Lipseste token-ul." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT Error:", err.message);
      return res.status(401).json({ mesaj: "Token invalid sau expirat." });
    }

    if (decoded.iat < SERVER_START_TIME) {
      return res.status(401).json({ mesaj: "Token invalid sau expirat." });
    }

    req.user = decoded;
    next();
  });
};

// Functie creare token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role_id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,                   
  message: { mesaj: "Prea multe încercări. Încearcă din nou după 15 minute." }
});


app.post("/api/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  con.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });

    if (result.length === 0) {
      return res
        .status(401)
        .json({ succes: false, mesaj: "Email sau parola gresita" });
    }

    const user = result[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ succes: false, mesaj: "Email sau parola gresita" });
    }

    const token = generateToken(user);

    return res.json({
      succes: true,
      mesaj: "Te-ai logat!",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        role_id: user.role_id,
      },
    });
  });
});

app.post("/api/register", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    const sql =
      "INSERT INTO users (role_id, firstName, lastName, email, password, phone) VALUES (1, ?, ?, ?, ?, ?)";
    con.query(
      sql,
      [firstName, lastName, email, hashedPassword, phone],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            message: "Eroare la inregistrare. Posibil email duplicat.",
          });
        }
        res.status(201).json({
          success: true,
          message: "Utilizator creat cu succes!",
          id: result.insertId,
        });
      },
    );
  } catch (error) {
    console.error("Eroare la procesarea parolei:", error);
    res.status(500).json({ message: "Eroare interna de securitate." });
  }
});

app.get("/api/stores", verifyToken, (req, res) => {
  const sql = "SELECT * FROM stores";
  con.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }
    res.json(result);
  });
});

app.get("/api/stores/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM stores WHERE id = ?";
  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ mesaj: "Store nu a fost gasit" });
    }
  });
});

app.post("/api/stores", verifyToken, (req, res) => {
  // Doar adminii (role_id 1) pot adăuga magazine
  if (req.user.role !== 1) {
    return res.status(403).json({ mesaj: "Acces interzis." });
  }

  const {
    name,
    address,
    logo_url,
    background_url,
    description,
    hours,
    phone,
    email,
    links,
    maps_link,
    rating,
  } = req.body;

  if (!name || !address) {
    return res
      .status(400)
      .json({ mesaj: "Numele și adresa sunt obligatorii." });
  }

  const sql = `
    INSERT INTO stores 
      (name, address, logo_url, background_url, description, hours, phone, email, links, maps_link, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    name,
    address,
    logo_url || null,
    background_url || null,
    description || null,
    hours || null,
    phone || null,
    email || null,
    links || null,
    maps_link || null,
    rating || null,
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ mesaj: "Eroare la adăugarea magazinului." });
    }
    res.status(201).json({
      succes: true,
      mesaj: "Magazin adăugat cu succes!",
      id: result.insertId,
    });
  });
});

app.delete("/api/stores/:id", verifyToken, (req, res) => {
  if (req.user.role !== 1)
    return res.status(403).json({ mesaj: "Acces interzis." });
  const { id } = req.params;
  con.query("DELETE FROM stores WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la ștergere." });
    res.json({ succes: true, mesaj: "Magazin șters." });
  });
});

// Get all loyalty cards for the logged-in user
app.get("/api/cards", verifyToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT s.*, lc.points, lc.total_points_earned, lc.id as card_id
    FROM loyalty_cards lc
    INNER JOIN stores s ON s.id = lc.store_id
    WHERE lc.user_id = ?
    ORDER BY lc.created_at DESC
  `;
  con.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    res.json(result);
  });
});

// Get a specific card for the logged-in user
app.get("/api/cards/:storeId", verifyToken, (req, res) => {
  const { storeId } = req.params;
  const userId = req.user.id; // from JWT token

  const sql = `
    SELECT s.*, lc.points, lc.total_points_earned, lc.id as card_id
    FROM stores s
    LEFT JOIN loyalty_cards lc 
      ON lc.store_id = s.id AND lc.user_id = ?
    WHERE s.id = ?
  `;

  con.query(sql, [userId, storeId], (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    if (result.length === 0)
      return res.status(404).json({ mesaj: "Store not found" });
    res.json(result[0]);
  });
});

// Claim a card
app.post("/api/cards/claim", verifyToken, (req, res) => {
  const { store_id } = req.body;
  const user_id = req.user.id;

  const sql = `
    INSERT INTO loyalty_cards (user_id, store_id, points, total_points_earned, created_at)
    VALUES (?, ?, 0, 0, NOW())
    ON CONFLICT (user_id, store_id) DO NOTHING
  `;
  // MySQL syntax:
  const sqlMySQL = `
    INSERT IGNORE INTO loyalty_cards (user_id, store_id, points, total_points_earned, created_at)
    VALUES (?, ?, 0, 0, NOW())
  `;

  con.query(sqlMySQL, [user_id, store_id], (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    res.status(201).json({ succes: true, mesaj: "Card claimed!" });
  });
});

// Get all liked stores for the logged-in user
app.get("/api/likes", verifyToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT s.* FROM stores s
    INNER JOIN liked_stores ls ON ls.store_id = s.id
    WHERE ls.user_id = ?
  `;
  con.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    res.json(result);
  });
});

// Like a store
app.post("/api/likes/:storeId", verifyToken, (req, res) => {
  const userId = req.user.id;
  const { storeId } = req.params;
  const sql = "INSERT IGNORE INTO liked_stores (user_id, store_id, created_at) VALUES (?, ?, NOW())";
  con.query(sql, [userId, storeId], (err) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    res.status(201).json({ succes: true, mesaj: "Store liked!" });
  });
});

// Unlike a store
app.delete("/api/likes/:storeId", verifyToken, (req, res) => {
  const userId = req.user.id;
  const { storeId } = req.params;
  const sql = "DELETE FROM liked_stores WHERE user_id = ? AND store_id = ?";
  con.query(sql, [userId, storeId], (err) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    res.json({ succes: true, mesaj: "Store unliked!" });
  });
});

app.use("/uploads", express.static(uploadsDir));

app.post("/api/upload", verifyToken, upload.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ mesaj: "Niciun fișier trimis." });
  const url = `http://localhost:8000/uploads/${req.file.filename}`;
  res.json({ url });
});

app.get("/api/qr-token", verifyToken, (req, res) => {
  const qrToken = jwt.sign(
    { userId: req.user.id, type: "qr" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  res.json({ qr_token: qrToken });
});

app.use((req, res, next) => {
  res.status(404).json({
    error: "Not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: "Internal server error",
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`CoffeeShop backend listening on port ${PORT}`);
  });
}

export { app };