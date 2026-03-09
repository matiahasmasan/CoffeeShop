import bcrypt from "bcrypt";
import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import mysql from "mysql";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 8000;

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

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  con.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });

    if (result.length > 0) {
      const user = result[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role_id},
          process.env.JWT_SECRET,
          { expiresIn: "1h" },
        );

        return res.json({
          succes: true,
          mesaj: "Te-ai logat!",
          token,
          user: { id: user.id, email: user.email, firstName: user.firstName },
        });
      } else {
        res
          .status(401)
          .json({ succes: false, mesaj: "Email sau parola gresita" });
      }
    } else {
      res
        .status(401)
        .json({ succes: false, mesaj: "Email sau parola gresita" });
    }
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

app.get("/api/stores", (req, res) => {
  const sql = "SELECT * FROM stores";
  con.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }
    res.json(result);
  });
});

app.get("/api/stores/:id", (req, res) => {
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

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "CoffeeShop backend is running",
  });
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

app.listen(PORT, () => {
  console.log(`CoffeeShop backend listening on port ${PORT}`);
});
