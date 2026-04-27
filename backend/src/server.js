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
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    mesaj:
      "There have been several failed attempts to sign in from this account or IP address. Please wait a while and try again later.",
  },
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
    const userPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role_id: user.role_id,
    };

    if (user.role_id === 3) {
      const storeStaffSql =
        "SELECT store_id FROM store_staff WHERE user_id = ? LIMIT 1";
      con.query(storeStaffSql, [user.id], (storeErr, storeResult) => {
        if (storeErr) {
          console.error(
            "Eroare la preluarea magazinului pentru staff:",
            storeErr,
          );
          return res.json({
            succes: true,
            mesaj: "Te-ai logat!",
            token,
            user: userPayload,
          });
        }
        if (storeResult.length > 0) {
          userPayload.store_id = storeResult[0].store_id;
        }
        return res.json({
          succes: true,
          mesaj: "Te-ai logat!",
          token,
          user: userPayload,
        });
      });
    } else {
      return res.json({
        succes: true,
        mesaj: "Te-ai logat!",
        token,
        user: userPayload,
      });
    }
  });
});

app.post("/api/register", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  try {
    const hashedPassword = await hashPassword(password);
    const sql =
      "INSERT INTO users (role_id, firstName, lastName, email, password, phone) VALUES (2, ?, ?, ?, ?, ?)";
    con.query(
      sql,
      [firstName, lastName, email, hashedPassword, phone],
      (err, result) => {
        if (err) {
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
    res.status(500).json({ message: "Eroare interna de securitate." });
  }
});

app.get("/api/stores", verifyToken, (req, res) => {
  const sql = `
    SELECT
      s.*,
      GROUP_CONCAT(DISTINCT si.url ORDER BY si.display_order SEPARATOR '|||') as images,
      COALESCE(AVG(r.rating), 0) as rating,
      COUNT(DISTINCT r.id) as review_count,
      ss.user_id as owner_id,
      u.firstName as ownerFirstName,
      u.lastName as ownerLastName
    FROM stores s
    LEFT JOIN store_images si ON si.store_id = s.id
    LEFT JOIN reviews r ON r.store_id = s.id
    LEFT JOIN store_staff ss ON ss.store_id = s.id
    LEFT JOIN users u ON u.id = ss.user_id
    GROUP BY s.id
  `;
  con.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }
    res.json(
      result.map((r) => ({
        ...r,
        images: r.images ? r.images.split("|||") : [],
      })),
    );
  });
});

app.get("/api/stores/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  con.query("SELECT * FROM stores WHERE id = ?", [id], (err, storeResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }
    if (storeResult.length === 0) {
      return res.status(404).json({ mesaj: "Store nu a fost gasit" });
    }
    const store = storeResult[0];
    con.query(
      "SELECT id, url, display_order FROM store_images WHERE store_id = ? ORDER BY display_order",
      [id],
      (err, imagesResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ mesaj: "Eroare la server" });
        }
        res.json({ ...store, images: imagesResult });
      },
    );
  });
});

app.put("/api/stores/:id", verifyToken, (req, res) => {
  if (req.user.role !== 1) {
    return res.status(403).json({ mesaj: "Acces interzis." });
  }

  const { id } = req.params;
  const {
    name,
    address,
    logo_url,
    description,
    hours,
    phone,
    email,
    links,
    maps_link,
  } = req.body;

  if (!name || !address) {
    return res
      .status(400)
      .json({ mesaj: "Numele și adresa sunt obligatorii." });
  }

  const sql = `
    UPDATE stores
    SET name = ?, address = ?, logo_url = ?, description = ?, hours = ?, phone = ?, email = ?, links = ?, maps_link = ?
    WHERE id = ?
  `;

  const values = [
    name,
    address,
    logo_url || null,
    description || null,
    hours || null,
    phone || null,
    email || null,
    links || null,
    maps_link || null,
    id,
  ];

  con.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ mesaj: "Eroare la actualizarea magazinului." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ mesaj: "Magazinul nu a fost găsit." });
    }
    res.json({ succes: true, mesaj: "Magazin actualizat cu succes!" });
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
      (name, address, logo_url, description, hours, phone, email, links, maps_link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    name,
    address,
    logo_url || null,
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

// Add image(s) to a store
app.post(
  "/api/stores/:id/images",
  verifyToken,
  upload.array("images", 10),
  (req, res) => {
    if (req.user.role !== 1)
      return res.status(403).json({ mesaj: "Acces interzis." });

    const { id } = req.params;
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ mesaj: "Niciun fișier trimis." });

    const values = req.files.map((file, i) => [
      id,
      `http://localhost:8000/uploads/${file.filename}`,
      i,
    ]);

    con.query(
      "INSERT INTO store_images (store_id, url, display_order) VALUES ?",
      [values],
      (err) => {
        if (err)
          return res
            .status(500)
            .json({ mesaj: "Eroare la salvarea imaginilor." });
        res.status(201).json({ succes: true, mesaj: "Imagini adăugate." });
      },
    );
  },
);

// Delete a store image
app.delete("/api/store-images/:imageId", verifyToken, (req, res) => {
  if (req.user.role !== 1)
    return res.status(403).json({ mesaj: "Acces interzis." });

  const { imageId } = req.params;
  con.query("DELETE FROM store_images WHERE id = ?", [imageId], (err) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la ștergere." });
    res.json({ succes: true, mesaj: "Imagine ștearsă." });
  });
});

// Preluare toți utilizatorii pentru asignare ca staff
app.get("/api/users", verifyToken, (req, res) => {
  if (req.user.role !== 1) {
    return res.status(403).json({ mesaj: "Acces interzis." });
  }

  const sql = "SELECT id, firstName, lastName, email FROM users";
  con.query(sql, (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    res.json(result);
  });
});

app.post("/api/store-staff", verifyToken, (req, res) => {
  if (req.user.role !== 1) {
    return res.status(403).json({ mesaj: "Acces interzis." });
  }

  const { user_id, store_id } = req.body;

  if (!user_id || !store_id) {
    return res
      .status(400)
      .json({ mesaj: "user_id și store_id sunt obligatorii." });
  }

  // 1. old owner (if exists)
  const checkSql = "SELECT user_id FROM store_staff WHERE store_id = ?";
  con.query(checkSql, [store_id], (checkErr, checkResult) => {
    if (checkErr) return res.status(500).json({ mesaj: "Eroare la verificarea magazinului." });

    const old_user_id = checkResult.length > 0 ? checkResult[0].user_id : null;

    // 2. set the new owner
    const sql = `
      INSERT INTO store_staff (store_id, user_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
    `;
    con.query(sql, [store_id, user_id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ mesaj: "Eroare la asignarea utilizatorului." });
      }

      // 3. upgrade new owner to role_id 3
      const updateRoleSql = "UPDATE users SET role_id = 3 WHERE id = ? AND role_id != 1";
      con.query(updateRoleSql, [user_id], (updateErr) => {
        if (updateErr) console.error("Eroare la actualizarea rolului:", updateErr);

        // 4. take the old owner back to role_id 2 if they have no other stores
        if (old_user_id && old_user_id != user_id) {
          const countStoresSql = "SELECT COUNT(*) as cnt FROM store_staff WHERE user_id = ?";
          con.query(countStoresSql, [old_user_id], (countErr, countResult) => {
            // make sure to log any error but not fail the main request
            if (!countErr && countResult[0].cnt === 0) {
              const downgradeSql = "UPDATE users SET role_id = 2 WHERE id = ? AND role_id != 1";
              con.query(downgradeSql, [old_user_id], (downErr) => {
                if (downErr) console.error("Eroare la retrogradarea vechiului proprietar:", downErr);
              });
            }
          });
        }

        const message = result.affectedRows > 1 ? "Proprietar actualizat cu succes." : "Proprietar asignat cu succes.";
        res.status(201).json({ succes: true, mesaj: message });
      });
    });
  });
});

// Get all loyalty cards for the logged-in user
app.get("/api/cards", verifyToken, (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT s.*, lc.points, lc.total_points_earned, lc.id as card_id,
      GROUP_CONCAT(si.url ORDER BY si.display_order SEPARATOR '|||') as images
    FROM loyalty_cards lc
    INNER JOIN stores s ON s.id = lc.store_id
    LEFT JOIN store_images si ON si.store_id = s.id
    WHERE lc.user_id = ?
    GROUP BY s.id, lc.id
    ORDER BY lc.created_at DESC
  `;
  con.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    res.json(
      result.map((r) => ({
        ...r,
        images: r.images ? r.images.split("|||") : [],
      })),
    );
  });
});

// Get a specific card for the logged-in user
app.get("/api/cards/:storeId", verifyToken, (req, res) => {
  const { storeId } = req.params;
  const userId = req.user.id;

  const sql = `
    SELECT s.*, lc.points, lc.total_points_earned, lc.id as card_id,
     GROUP_CONCAT(DISTINCT si.url ORDER BY si.display_order SEPARATOR '|||') as images,
    COALESCE(AVG(r.rating), 0) as rating
    FROM stores s
    LEFT JOIN loyalty_cards lc ON lc.store_id = s.id AND lc.user_id = ?
    LEFT JOIN store_images si ON si.store_id = s.id
    LEFT JOIN reviews r ON r.store_id = s.id
    WHERE s.id = ?
    GROUP BY s.id, lc.id
  `;

  con.query(sql, [userId, storeId], (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    if (result.length === 0)
      return res.status(404).json({ mesaj: "Store not found" });
    const row = result[0];
    res.json({ ...row, images: row.images ? row.images.split("|||") : [] });
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
  const sql =
    "INSERT IGNORE INTO liked_stores (user_id, store_id, created_at) VALUES (?, ?, NOW())";
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
    { expiresIn: "5m" },
  );

  res.json({ qr_token: qrToken });
});

// GET /api/reviews/:storeId — toate review-urile unui magazin
app.get("/api/reviews/:storeId", verifyToken, (req, res) => {
  const { storeId } = req.params;
  const sql = `
    SELECT r.id, r.user_id, r.rating, r.comment, r.created_at,
           u.firstName, u.lastName
    FROM reviews r
    INNER JOIN users u ON u.id = r.user_id
    WHERE r.store_id = ?
    ORDER BY r.created_at DESC
  `;
  con.query(sql, [storeId], (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    res.json(result);
  });
});

// POST /api/reviews/:storeId — adaugă sau actualizează review-ul userului
app.post("/api/reviews/:storeId", verifyToken, (req, res) => {
  const { storeId } = req.params;
  const userId = req.user.id;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ mesaj: "Rating trebuie să fie între 1 și 5." });
  }

  const sql = `
    INSERT INTO reviews (user_id, store_id, rating, comment)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)
  `;
  con.query(sql, [userId, storeId, rating, comment || null], (err) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    res.status(201).json({ succes: true });
  });
});

app.get("/api/owner/baristas", verifyToken, (req, res) => {
  if (req.user.role !== 3)
    return res.status(403).json({ mesaj: "Acces interzis." });

  con.query(
    "SELECT store_id FROM store_staff WHERE user_id = ?",
    [req.user.id],
    (err, staffRows) => {
      if (err) {
        console.error("store_staff lookup error:", err);
        return res.status(500).json({ mesaj: "Eroare la server" });
      }
      if (!staffRows.length)
        return res
          .status(404)
          .json({ mesaj: "Nu ești asociat niciunui magazin." });

      const storeId = staffRows[0].store_id;

      const sql = `
        SELECT
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          u.phone,
          u.created_at   AS user_created_at,
          ss.created_at  AS joined_at
        FROM store_staff ss
        INNER JOIN users u ON u.id = ss.user_id
        WHERE ss.store_id = ? AND u.role_id = 4
        ORDER BY ss.created_at DESC
      `;

      con.query(sql, [storeId], (err2, result) => {
        if (err2) {
          console.error("baristas query error:", err2);
          return res.status(500).json({ mesaj: "Eroare la server" });
        }
        res.json({ storeId, baristas: result });
      });
    },
  );
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
