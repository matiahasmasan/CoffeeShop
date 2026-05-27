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
import Hashids from "hashids";

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

const hashids = new Hashids(
  process.env.HASHIDS_SALT,
  6,
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
);

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
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role_id,
  };

  if (user.store_id) {
    payload.store_id = user.store_id;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Audit log helper — fire-and-forget. If the insert fails we log but never
// fail the surrounding request (the points change has already been applied).
const logTransaction = ({ userId, storeId, baristaId, type, points }) => {
  const sql = `
    INSERT INTO transactions (user_id, store_id, barista_id, type, points)
    VALUES (?, ?, ?, ?, ?)
  `;
  con.query(sql, [userId, storeId, baristaId, type, points], (err) => {
    if (err) console.error("[transactions] insert:", err);
  });
};

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
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

    const userPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role_id: user.role_id,
    };

    // For staff (owners/baristas), fetch store_id first
    if (user.role_id === 3 || user.role_id === 4) {
      const storeStaffSql =
        "SELECT store_id FROM store_staff WHERE user_id = ? LIMIT 1";
      con.query(storeStaffSql, [user.id], (storeErr, storeResult) => {
        if (storeErr) {
          console.error(
            "Eroare la preluarea magazinului pentru staff:",
            storeErr,
          );
          // Continue without store_id
          const token = generateToken(user);
          return res.json({
            succes: true,
            mesaj: "Te-ai logat!",
            token,
            user: userPayload,
          });
        }

        if (storeResult.length > 0) {
          user.store_id = storeResult[0].store_id;
          userPayload.store_id = storeResult[0].store_id;
        }

        // Generate token with store_id included
        const token = generateToken(user);
        return res.json({
          succes: true,
          mesaj: "Te-ai logat!",
          token,
          user: userPayload,
        });
      });
    } else {
      // For regular users, generate token directly
      const token = generateToken(user);
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
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 8));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const search = (req.query.search || "").trim();
  const rating = parseInt(req.query.rating, 10) || 0;
  const liked = req.query.liked === "true" || req.query.liked === "1";
  const sortKey = req.query.sort || "az";

  const sortMap = {
    az: "s.name ASC",
    za: "s.name DESC",
    "rating-desc": "rating DESC, s.name ASC",
    "rating-asc": "rating ASC, s.name ASC",
  };
  const orderBy = sortMap[sortKey] || sortMap.az;

  const whereClauses = [];
  const whereParams = [];
  if (search) {
    whereClauses.push("s.name LIKE ?");
    whereParams.push(`%${search}%`);
  }

  // Visibility: regular users only see approved stores.
  // Admins (role 1) may request a specific status via ?status=
  const allowedStatuses = ["pending", "approved", "rejected"];
  if (req.user.role === 1 && allowedStatuses.includes(req.query.status)) {
    whereClauses.push("s.status = ?");
    whereParams.push(req.query.status);
  } else {
    whereClauses.push("s.status = ?");
    whereParams.push("approved");
  }

  const whereSql = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const havingClauses = [];
  const havingParams = [];
  if (rating > 0) {
    havingClauses.push("rating >= ?");
    havingParams.push(rating);
  }
  if (liked) {
    havingClauses.push("is_liked = 1");
  }
  const havingSql = havingClauses.length
    ? `HAVING ${havingClauses.join(" AND ")}`
    : "";

  const dataSql = `
    SELECT
      s.*,
      GROUP_CONCAT(DISTINCT si.url ORDER BY si.display_order SEPARATOR '|||') as images,
      COALESCE(AVG(r.rating), 0) as rating,
      COUNT(DISTINCT r.id) as review_count,
      ss.user_id as owner_id,
      u.firstName as ownerFirstName,
      u.lastName as ownerLastName,
      MAX(CASE WHEN ls.user_id IS NOT NULL THEN 1 ELSE 0 END) as is_liked
    FROM stores s
    LEFT JOIN store_images si ON si.store_id = s.id
    LEFT JOIN reviews r ON r.store_id = s.id
    LEFT JOIN store_staff ss ON ss.store_id = s.id
    LEFT JOIN users u ON u.id = ss.user_id
    LEFT JOIN liked_stores ls ON ls.store_id = s.id AND ls.user_id = ?
    ${whereSql}
    GROUP BY s.id
    ${havingSql}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  const dataParams = [
    req.user.id,
    ...whereParams,
    ...havingParams,
    limit,
    offset,
  ];

  const countSql = `
    SELECT COUNT(*) as total FROM (
      SELECT s.id,
        COALESCE(AVG(r.rating), 0) as rating,
        MAX(CASE WHEN ls.user_id IS NOT NULL THEN 1 ELSE 0 END) as is_liked
      FROM stores s
      LEFT JOIN reviews r ON r.store_id = s.id
      LEFT JOIN liked_stores ls ON ls.store_id = s.id AND ls.user_id = ?
      ${whereSql}
      GROUP BY s.id
      ${havingSql}
    ) sub
  `;
  const countParams = [req.user.id, ...whereParams, ...havingParams];

  con.query(countSql, countParams, (countErr, countResult) => {
    if (countErr) {
      console.error(countErr);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }
    const total = countResult[0]?.total ?? 0;
    con.query(dataSql, dataParams, (dataErr, dataResult) => {
      if (dataErr) {
        console.error(dataErr);
        return res.status(500).json({ mesaj: "Eroare la server" });
      }
      res.json({
        stores: dataResult.map((r) => ({
          ...r,
          images: r.images ? r.images.split("|||") : [],
        })),
        total,
      });
    });
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

// POST /api/stores/submit - self-service store listing by a regular user
app.post("/api/stores/submit", verifyToken, (req, res) => {
  const userId = req.user.id;
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
    menu,
  } = req.body;

  if (!name || !address) {
    return res
      .status(400)
      .json({ mesaj: "Numele și adresa sunt obligatorii." });
  }

  // Validate the optional menu payload up front
  const menuInput = Array.isArray(menu) ? menu : [];
  for (const category of menuInput) {
    if (
      !category ||
      typeof category.name !== "string" ||
      !category.name.trim()
    ) {
      return res
        .status(400)
        .json({ mesaj: "Fiecare categorie de meniu trebuie să aibă un nume." });
    }
    const items = Array.isArray(category.items) ? category.items : [];
    for (const item of items) {
      if (!item || typeof item.name !== "string" || !item.name.trim()) {
        return res
          .status(400)
          .json({ mesaj: "Fiecare produs din meniu trebuie să aibă un nume." });
      }
      const price = Number(item.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          mesaj: "Prețul produselor trebuie să fie un număr pozitiv.",
        });
      }
    }
  }

  // Block users who already belong to a store or have a pending request
  con.query(
    "SELECT store_id FROM store_staff WHERE user_id = ? LIMIT 1",
    [userId],
    (staffErr, staffRows) => {
      if (staffErr) return res.status(500).json({ mesaj: "Eroare la server" });
      if (staffRows.length) {
        return res
          .status(409)
          .json({ mesaj: "Ești deja asociat unui magazin." });
      }

      con.query(
        "SELECT id FROM stores WHERE submitted_by = ? AND status = 'pending' LIMIT 1",
        [userId],
        (pendErr, pendRows) => {
          if (pendErr)
            return res.status(500).json({ mesaj: "Eroare la server" });
          if (pendRows.length) {
            return res.status(409).json({
              mesaj: "Ai deja o cerere de listare în așteptare.",
            });
          }

          // All checks passed -> insert store + menu inside a transaction
          con.beginTransaction((txErr) => {
            if (txErr)
              return res.status(500).json({ mesaj: "Eroare la server" });

            const storeSql = `
              INSERT INTO stores
                (name, address, logo_url, description, hours, phone, email, links, maps_link, status, submitted_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            `;
            const storeValues = [
              name,
              address,
              logo_url || null,
              description || null,
              hours || null,
              phone || null,
              email || null,
              links || null,
              maps_link || null,
              userId,
            ];

            con.query(storeSql, storeValues, (storeErr, storeResult) => {
              if (storeErr) {
                return con.rollback(() =>
                  res
                    .status(500)
                    .json({ mesaj: "Eroare la trimiterea cererii." }),
                );
              }

              const storeId = storeResult.insertId;

              // Insert menu categories one by one (need each category id)
              const insertCategory = (index) => {
                if (index >= menuInput.length) {
                  return con.commit((commitErr) => {
                    if (commitErr) {
                      return con.rollback(() =>
                        res
                          .status(500)
                          .json({ mesaj: "Eroare la trimiterea cererii." }),
                      );
                    }
                    return res.status(201).json({
                      succes: true,
                      mesaj:
                        "Cererea a fost trimisă. Așteaptă aprobarea administratorului.",
                      id: storeId,
                    });
                  });
                }

                const category = menuInput[index];
                const slug =
                  category.name
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "") || `categorie-${index + 1}`;

                con.query(
                  "INSERT INTO menu_categories (store_id, name, slug, display_order) VALUES (?, ?, ?, ?)",
                  [storeId, category.name.trim(), slug, index],
                  (catErr, catResult) => {
                    if (catErr) {
                      return con.rollback(() =>
                        res
                          .status(500)
                          .json({ mesaj: "Eroare la salvarea meniului." }),
                      );
                    }

                    const categoryId = catResult.insertId;
                    const items = (
                      Array.isArray(category.items) ? category.items : []
                    ).filter((it) => it && it.name && it.name.trim());

                    if (items.length === 0) {
                      return insertCategory(index + 1);
                    }

                    const itemValues = items.map((it) => [
                      categoryId,
                      it.name.trim(),
                      it.description ? String(it.description).trim() : null,
                      Number(it.price) || 0,
                      it.available === false ? 0 : 1,
                    ]);

                    con.query(
                      "INSERT INTO menu_items (category_id, name, description, price, available) VALUES ?",
                      [itemValues],
                      (itemErr) => {
                        if (itemErr) {
                          return con.rollback(() =>
                            res
                              .status(500)
                              .json({ mesaj: "Eroare la salvarea meniului." }),
                          );
                        }
                        insertCategory(index + 1);
                      },
                    );
                  },
                );
              };

              insertCategory(0);
            });
          });
        },
      );
    },
  );
});

// PUT /api/stores/:id/approve - admin approves a pending store listing
app.put("/api/stores/:id/approve", verifyToken, (req, res) => {
  if (req.user.role !== 1)
    return res.status(403).json({ mesaj: "Acces interzis." });

  const { id } = req.params;

  con.query(
    "SELECT id, status, submitted_by FROM stores WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ mesaj: "Eroare la server" });
      if (!rows.length)
        return res.status(404).json({ mesaj: "Magazinul nu a fost găsit." });

      const store = rows[0];
      if (store.status !== "pending") {
        return res
          .status(400)
          .json({ mesaj: "Magazinul nu este în așteptare." });
      }
      if (!store.submitted_by) {
        return res
          .status(400)
          .json({ mesaj: "Magazinul nu are un proprietar propus." });
      }

      con.beginTransaction((txErr) => {
        if (txErr) return res.status(500).json({ mesaj: "Eroare la server" });

        con.query(
          "UPDATE stores SET status = 'approved' WHERE id = ?",
          [id],
          (updErr) => {
            if (updErr)
              return con.rollback(() =>
                res.status(500).json({ mesaj: "Eroare la aprobare." }),
              );

            con.query(
              "INSERT INTO store_staff (store_id, user_id) VALUES (?, ?)",
              [id, store.submitted_by],
              (staffErr) => {
                if (staffErr)
                  return con.rollback(() =>
                    res.status(500).json({ mesaj: "Eroare la aprobare." }),
                  );

                con.query(
                  "UPDATE users SET role_id = 3 WHERE id = ? AND role_id != 1",
                  [store.submitted_by],
                  (roleErr) => {
                    if (roleErr)
                      return con.rollback(() =>
                        res.status(500).json({ mesaj: "Eroare la aprobare." }),
                      );

                    con.commit((commitErr) => {
                      if (commitErr)
                        return con.rollback(() =>
                          res
                            .status(500)
                            .json({ mesaj: "Eroare la aprobare." }),
                        );
                      res.json({
                        succes: true,
                        mesaj: "Magazin aprobat cu succes!",
                      });
                    });
                  },
                );
              },
            );
          },
        );
      });
    },
  );
});

// PUT /api/stores/:id/reject - admin rejects a pending store listing
app.put("/api/stores/:id/reject", verifyToken, (req, res) => {
  if (req.user.role !== 1)
    return res.status(403).json({ mesaj: "Acces interzis." });

  const { id } = req.params;

  con.query(
    "UPDATE stores SET status = 'rejected' WHERE id = ? AND status = 'pending'",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ mesaj: "Eroare la respingere." });
      if (result.affectedRows === 0)
        return res.status(404).json({
          mesaj: "Magazinul nu a fost găsit sau nu este în așteptare.",
        });
      res.json({ succes: true, mesaj: "Magazin respins." });
    },
  );
});

// Add image(s) to a store
app.post(
  "/api/stores/:id/images",
  verifyToken,
  upload.array("images", 10),
  (req, res) => {
    const { id } = req.params;
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ mesaj: "Niciun fișier trimis." });

    // Admins, or the user who submitted this store, may add images
    con.query(
      "SELECT submitted_by FROM stores WHERE id = ?",
      [id],
      (lookupErr, storeRows) => {
        if (lookupErr)
          return res.status(500).json({ mesaj: "Eroare la server" });
        if (!storeRows.length)
          return res.status(404).json({ mesaj: "Magazinul nu a fost găsit." });

        const isAdmin = req.user.role === 1;
        const isSubmitter = storeRows[0].submitted_by === req.user.id;
        if (!isAdmin && !isSubmitter) {
          return res.status(403).json({ mesaj: "Acces interzis." });
        }

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

// Per-barista dashboard stats — today's counters + last 5 actions for the
// logged-in barista (or owner, who shares the same role check pattern).
app.get("/api/barista/stats", verifyToken, (req, res) => {
  if (req.user.role !== 3 && req.user.role !== 4) {
    return res.status(403).json({ mesaj: "Nu ai permisiunea necesara." });
  }

  const baristaId = req.user.id;

  const countsSql = `
    SELECT
      COUNT(*) AS scansToday,
      COALESCE(SUM(CASE WHEN type = 'earn'   THEN points ELSE 0 END), 0) AS pointsToday,
      COALESCE(SUM(CASE WHEN type = 'redeem' THEN 1      ELSE 0 END), 0) AS rewardsToday
    FROM transactions
    WHERE barista_id = ? AND DATE(created_at) = CURDATE()
  `;

  con.query(countsSql, [baristaId], (countsErr, countsRows) => {
    if (countsErr) {
      console.error("[barista/stats] counts:", countsErr);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }
    const c = countsRows[0] || {};

    const recentSql = `
      SELECT
        t.id, t.type, t.points, t.created_at,
        cu.firstName AS customerFirstName,
        cu.lastName  AS customerLastName
      FROM transactions t
      LEFT JOIN users cu ON cu.id = t.user_id
      WHERE t.barista_id = ?
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT 5
    `;
    con.query(recentSql, [baristaId], (recentErr, recent) => {
      if (recentErr) {
        console.error("[barista/stats] recent:", recentErr);
        return res.status(500).json({ mesaj: "Eroare la server" });
      }
      res.json({
        scansToday: Number(c.scansToday) || 0,
        pointsToday: Number(c.pointsToday) || 0,
        rewardsToday: Number(c.rewardsToday) || 0,
        recent,
      });
    });
  });
});

// Store-wide dashboard stats — today's counters + last 5 actions across all
// staff at the caller's store. Used by OwnerDashboard.
app.get("/api/store/stats", verifyToken, (req, res) => {
  if (req.user.role !== 3 && req.user.role !== 4) {
    return res.status(403).json({ mesaj: "Nu ai permisiunea necesara." });
  }

  const staffStoreSql =
    "SELECT store_id FROM store_staff WHERE user_id = ? LIMIT 1";
  con.query(staffStoreSql, [req.user.id], (staffErr, staffRows) => {
    if (staffErr) return res.status(500).json({ mesaj: "Eroare la server" });
    if (!staffRows.length) {
      return res.status(403).json({ mesaj: "Nu esti asignat unui magazin." });
    }
    const storeId = staffRows[0].store_id;

    const countsSql = `
      SELECT
        COUNT(*) AS scansToday,
        COALESCE(SUM(CASE WHEN type = 'earn'   THEN points ELSE 0 END), 0) AS pointsToday,
        COALESCE(SUM(CASE WHEN type = 'redeem' THEN 1      ELSE 0 END), 0) AS rewardsToday
      FROM transactions
      WHERE store_id = ? AND DATE(created_at) = CURDATE()
    `;

    con.query(countsSql, [storeId], (countsErr, countsRows) => {
      if (countsErr) {
        console.error("[store/stats] counts:", countsErr);
        return res.status(500).json({ mesaj: "Eroare la server" });
      }
      const c = countsRows[0] || {};

      const recentSql = `
        SELECT
          t.id, t.type, t.points, t.created_at,
          cu.firstName AS customerFirstName,
          cu.lastName  AS customerLastName,
          bu.firstName AS baristaFirstName,
          bu.lastName  AS baristaLastName
        FROM transactions t
        LEFT JOIN users cu ON cu.id = t.user_id
        LEFT JOIN users bu ON bu.id = t.barista_id
        WHERE t.store_id = ?
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT 5
      `;
      con.query(recentSql, [storeId], (recentErr, recent) => {
        if (recentErr) {
          console.error("[store/stats] recent:", recentErr);
          return res.status(500).json({ mesaj: "Eroare la server" });
        }
        res.json({
          scansToday: Number(c.scansToday) || 0,
          pointsToday: Number(c.pointsToday) || 0,
          rewardsToday: Number(c.rewardsToday) || 0,
          recent,
        });
      });
    });
  });
});

// Store-scoped transactions — owners (role 3) and baristas (role 4) see every
// earn/redeem at the store they're assigned to via store_staff.
app.get("/api/store/transactions", verifyToken, (req, res) => {
  if (req.user.role !== 3 && req.user.role !== 4) {
    return res.status(403).json({ mesaj: "Nu ai permisiunea necesara." });
  }

  const staffStoreSql =
    "SELECT store_id FROM store_staff WHERE user_id = ? LIMIT 1";
  con.query(staffStoreSql, [req.user.id], (staffErr, staffRows) => {
    if (staffErr) return res.status(500).json({ mesaj: "Eroare la server" });
    if (!staffRows.length) {
      return res.status(403).json({ mesaj: "Nu esti asignat unui magazin." });
    }
    const storeId = staffRows[0].store_id;

    const sql = `
      SELECT
        t.id, t.type, t.points, t.created_at,
        t.user_id,
        cu.firstName AS customerFirstName,
        cu.lastName  AS customerLastName,
        t.barista_id,
        bu.firstName AS baristaFirstName,
        bu.lastName  AS baristaLastName
      FROM transactions t
      LEFT JOIN users cu ON cu.id = t.user_id
      LEFT JOIN users bu ON bu.id = t.barista_id
      WHERE t.store_id = ?
      ORDER BY t.created_at DESC, t.id DESC
    `;
    con.query(sql, [storeId], (err, rows) => {
      if (err) {
        console.error("[store/transactions]", err);
        return res.status(500).json({ mesaj: "Eroare la server" });
      }
      res.json(rows);
    });
  });
});

// Admin — list all point transactions (earns + redemptions) with joined names.
app.get("/api/admin/transactions", verifyToken, (req, res) => {
  if (req.user.role !== 1) {
    return res.status(403).json({ mesaj: "Acces interzis." });
  }

  const sql = `
    SELECT
      t.id, t.type, t.points, t.created_at,
      t.user_id,
      cu.firstName  AS customerFirstName,
      cu.lastName   AS customerLastName,
      t.store_id,
      s.name        AS storeName,
      t.barista_id,
      bu.firstName  AS baristaFirstName,
      bu.lastName   AS baristaLastName
    FROM transactions t
    LEFT JOIN users  cu ON cu.id = t.user_id
    LEFT JOIN stores s  ON s.id  = t.store_id
    LEFT JOIN users  bu ON bu.id = t.barista_id
    ORDER BY t.created_at DESC, t.id DESC
  `;
  con.query(sql, (err, rows) => {
    if (err) {
      console.error("[admin/transactions]", err);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }
    res.json(rows);
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
    if (checkErr)
      return res
        .status(500)
        .json({ mesaj: "Eroare la verificarea magazinului." });

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
        return res
          .status(500)
          .json({ mesaj: "Eroare la asignarea utilizatorului." });
      }

      // 3. upgrade new owner to role_id 3
      const updateRoleSql =
        "UPDATE users SET role_id = 3 WHERE id = ? AND role_id != 1";
      con.query(updateRoleSql, [user_id], (updateErr) => {
        if (updateErr)
          console.error("Eroare la actualizarea rolului:", updateErr);

        // 4. take the old owner back to role_id 2 if they have no other stores
        if (old_user_id && old_user_id != user_id) {
          const countStoresSql =
            "SELECT COUNT(*) as cnt FROM store_staff WHERE user_id = ?";
          con.query(countStoresSql, [old_user_id], (countErr, countResult) => {
            // make sure to log any error but not fail the main request
            if (!countErr && countResult[0].cnt === 0) {
              const downgradeSql =
                "UPDATE users SET role_id = 2 WHERE id = ? AND role_id != 1";
              con.query(downgradeSql, [old_user_id], (downErr) => {
                if (downErr)
                  console.error(
                    "Eroare la retrogradarea vechiului proprietar:",
                    downErr,
                  );
              });
            }
          });
        }

        const message =
          result.affectedRows > 1
            ? "Proprietar actualizat cu succes."
            : "Proprietar asignat cu succes.";
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
  const shortCode = hashids.encode(req.user.id);

  res.json({ qr_token: qrToken, short_code: shortCode });
});

app.post("/api/qr/resolve", verifyToken, (req, res) => {
  const { qrToken, userId, shortCode } = req.body;

  // Handle short code (hashids-encoded user id)
  if (shortCode) {
    if (typeof shortCode !== "string") {
      return res.status(400).json({ mesaj: "Cod invalid." });
    }
    const decoded = hashids.decode(shortCode);
    if (!decoded.length) {
      return res.status(400).json({ mesaj: "Cod invalid." });
    }
    const decodedUserId = Number(decoded[0]);
    if (!Number.isInteger(decodedUserId) || decodedUserId <= 0) {
      return res.status(400).json({ mesaj: "Cod invalid." });
    }

    const sql = "SELECT firstName, lastName FROM users WHERE id = ? LIMIT 1";
    con.query(sql, [decodedUserId], (err, result) => {
      if (err) return res.status(500).json({ mesaj: "Eroare la server" });
      if (!result.length) {
        return res.status(404).json({ mesaj: "Clientul nu a fost gasit." });
      }

      const user = result[0];
      const clientName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");
      return res.json({
        succes: true,
        clientName,
        userId: decodedUserId,
      });
    });
    return;
  }

  // Handle manual user ID lookup
  if (userId) {
    const parsedUserId = Number(userId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({ mesaj: "User ID invalid." });
    }

    const sql = "SELECT firstName, lastName FROM users WHERE id = ? LIMIT 1";
    con.query(sql, [parsedUserId], (err, result) => {
      if (err) return res.status(500).json({ mesaj: "Eroare la server" });
      if (!result.length) {
        return res.status(404).json({ mesaj: "Clientul nu a fost gasit." });
      }

      const user = result[0];
      const clientName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");
      return res.json({
        succes: true,
        clientName,
        userId: parsedUserId,
      });
    });
    return;
  }

  // Handle QR token scan
  if (!qrToken || typeof qrToken !== "string") {
    return res.status(400).json({ mesaj: "QR token lipseste." });
  }

  let decoded;
  try {
    decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ mesaj: "QR token invalid sau expirat." });
  }

  if (decoded?.type !== "qr" || !decoded?.userId) {
    return res.status(400).json({ mesaj: "QR token invalid pentru check-in." });
  }

  const sql = "SELECT firstName, lastName FROM users WHERE id = ? LIMIT 1";
  con.query(sql, [decoded.userId], (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });
    if (!result.length) {
      return res.status(404).json({ mesaj: "Clientul nu a fost gasit." });
    }

    const user = result[0];
    const clientName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ");
    return res.json({
      succes: true,
      clientName,
      userId: decoded.userId,
    });
  });
});

app.post("/api/barista/points/add", verifyToken, (req, res) => {
  if (req.user.role !== 4 && req.user.role !== 3) {
    return res.status(403).json({ mesaj: "Nu ai permisiunea necesara." });
  }

  const { customerUserId, points } = req.body;
  const parsedCustomerUserId = Number(customerUserId);
  const parsedPoints = Number(points);

  if (!Number.isInteger(parsedCustomerUserId) || parsedCustomerUserId <= 0) {
    return res.status(400).json({ mesaj: "Client invalid." });
  }

  if (
    !Number.isInteger(parsedPoints) ||
    parsedPoints <= 0 ||
    parsedPoints > 20
  ) {
    return res
      .status(400)
      .json({ mesaj: "Numarul de puncte trebuie sa fie intre 1 si 20." });
  }

  const staffStoreSql =
    "SELECT store_id FROM store_staff WHERE user_id = ? LIMIT 1";
  con.query(staffStoreSql, [req.user.id], (staffErr, staffRows) => {
    if (staffErr) {
      console.error("[points/add] staff lookup:", staffErr);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }
    if (!staffRows.length) {
      return res.status(403).json({ mesaj: "Nu esti asignat unui magazin." });
    }

    const storeId = staffRows[0].store_id;
    const storeSql =
      "SELECT id, name, store_points, max_points FROM stores WHERE id = ? LIMIT 1";
    con.query(storeSql, [storeId], (storeErr, storeRows) => {
      if (storeErr) {
        console.error("[points/add] store lookup:", storeErr);
        return res.status(500).json({ mesaj: "Eroare la server" });
      }
      if (!storeRows.length) {
        return res.status(404).json({ mesaj: "Magazinul nu a fost gasit." });
      }

      const store = storeRows[0];
      let maxPoints = Number(store.max_points);
      if (!Number.isFinite(maxPoints) || maxPoints <= 0) {
        maxPoints = 6;
      }
      const upsertSql = `
        INSERT INTO loyalty_cards (user_id, store_id, points, total_points_earned, created_at)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          points = LEAST(points + VALUES(points), ?),
          total_points_earned = total_points_earned + VALUES(total_points_earned)
      `;

      con.query(
        upsertSql,
        [parsedCustomerUserId, storeId, parsedPoints, parsedPoints, maxPoints],
        (upsertErr) => {
          if (upsertErr) {
            console.error("[points/add] upsert:", upsertErr);
            return res.status(500).json({ mesaj: "Eroare la server" });
          }

          logTransaction({
            userId: parsedCustomerUserId,
            storeId,
            baristaId: req.user.id,
            type: "earn",
            points: parsedPoints,
          });

          const resultSql = `
            SELECT lc.points, lc.total_points_earned, u.firstName, u.lastName
            FROM loyalty_cards lc
            INNER JOIN users u ON u.id = lc.user_id
            WHERE lc.user_id = ? AND lc.store_id = ?
            LIMIT 1
          `;
          con.query(
            resultSql,
            [parsedCustomerUserId, storeId],
            (resultErr, rows) => {
              if (resultErr) {
                console.error("[points/add] result fetch:", resultErr);
                return res.status(500).json({ mesaj: "Eroare la server" });
              }
              if (!rows.length) {
                return res
                  .status(404)
                  .json({ mesaj: "Clientul nu a fost gasit." });
              }

              const card = rows[0];
              return res.json({
                succes: true,
                mesaj: "Puncte adaugate cu succes.",
                clientName: [card.firstName, card.lastName]
                  .filter(Boolean)
                  .join(" "),
                storeName: store.name,
                pointsAdded: parsedPoints,
                pointsNow: card.points,
                totalPointsEarned: card.total_points_earned,
              });
            },
          );
        },
      );
    });
  });
});

// POST /api/barista/reward/redeem - redeem a reward (free coffee)
app.post("/api/barista/reward/redeem", verifyToken, (req, res) => {
  if (req.user.role !== 4 && req.user.role !== 3) {
    return res.status(403).json({ mesaj: "Nu ai permisiunea necesara." });
  }

  const { customerUserId } = req.body;
  const parsedCustomerUserId = Number(customerUserId);

  if (!Number.isInteger(parsedCustomerUserId) || parsedCustomerUserId <= 0) {
    return res.status(400).json({ mesaj: "Client invalid." });
  }

  const staffStoreSql =
    "SELECT store_id FROM store_staff WHERE user_id = ? LIMIT 1";
  con.query(staffStoreSql, [req.user.id], (staffErr, staffRows) => {
    if (staffErr) return res.status(500).json({ mesaj: "Eroare la server" });
    if (!staffRows.length) {
      return res.status(403).json({ mesaj: "Nu esti asignat unui magazin." });
    }

    const storeId = staffRows[0].store_id;
    const storeSql =
      "SELECT id, name, store_points, max_points FROM stores WHERE id = ? LIMIT 1";
    con.query(storeSql, [storeId], (storeErr, storeRows) => {
      if (storeErr) return res.status(500).json({ mesaj: "Eroare la server" });
      if (!storeRows.length) {
        return res.status(404).json({ mesaj: "Magazinul nu a fost gasit." });
      }

      const store = storeRows[0];
      const rewardThreshold = Number(store.store_points) || 6;

      // Check if customer has enough points
      const checkSql = `
        SELECT lc.points, u.firstName, u.lastName
        FROM loyalty_cards lc
        INNER JOIN users u ON u.id = lc.user_id
        WHERE lc.user_id = ? AND lc.store_id = ?
        LIMIT 1
      `;
      con.query(
        checkSql,
        [parsedCustomerUserId, storeId],
        (checkErr, checkRows) => {
          if (checkErr)
            return res.status(500).json({ mesaj: "Eroare la server" });
          if (!checkRows.length) {
            return res.status(404).json({
              mesaj: "Clientul nu are card de loialitate la acest magazin.",
            });
          }

          const card = checkRows[0];
          const currentPoints = Number(card.points);

          if (currentPoints < rewardThreshold) {
            return res.status(400).json({
              mesaj: `Clientul nu are suficiente puncte. Necesare: ${rewardThreshold}, Are: ${currentPoints}`,
              clientName: [card.firstName, card.lastName]
                .filter(Boolean)
                .join(" "),
              pointsNeeded: rewardThreshold,
              pointsHas: currentPoints,
            });
          }

          // Deduct points
          const newPoints = currentPoints - rewardThreshold;
          const updateSql = `
            UPDATE loyalty_cards
            SET points = ?
            WHERE user_id = ? AND store_id = ?
          `;
          con.query(
            updateSql,
            [newPoints, parsedCustomerUserId, storeId],
            (updateErr) => {
              if (updateErr)
                return res.status(500).json({ mesaj: "Eroare la server" });

              logTransaction({
                userId: parsedCustomerUserId,
                storeId,
                baristaId: req.user.id,
                type: "redeem",
                points: rewardThreshold,
              });

              return res.json({
                succes: true,
                mesaj: "Recompensa eliberata cu succes!",
                clientName: [card.firstName, card.lastName]
                  .filter(Boolean)
                  .join(" "),
                storeName: store.name,
                pointsRedeemed: rewardThreshold,
                pointsRemaining: newPoints,
              });
            },
          );
        },
      );
    });
  });
});

// GET /api/barista/customer-card/:storeId/:customerId - get a customer's card for reward redemption
app.get(
  "/api/barista/customer-card/:storeId/:customerId",
  verifyToken,
  (req, res) => {
    if (req.user.role !== 4 && req.user.role !== 3) {
      return res.status(403).json({ mesaj: "Nu ai permisiunea necesara." });
    }

    const { storeId, customerId } = req.params;
    const parsedStoreId = Number(storeId);
    const parsedCustomerId = Number(customerId);

    if (!Number.isInteger(parsedStoreId) || parsedStoreId <= 0) {
      return res.status(400).json({ mesaj: "Magazin invalid." });
    }
    if (!Number.isInteger(parsedCustomerId) || parsedCustomerId <= 0) {
      return res.status(400).json({ mesaj: "Client invalid." });
    }

    // Verify barista belongs to this store
    const staffStoreSql =
      "SELECT store_id FROM store_staff WHERE user_id = ? LIMIT 1";
    con.query(staffStoreSql, [req.user.id], (staffErr, staffRows) => {
      if (staffErr) return res.status(500).json({ mesaj: "Eroare la server" });
      if (!staffRows.length) {
        return res.status(403).json({ mesaj: "Nu esti asignat unui magazin." });
      }
      if (staffRows[0].store_id !== parsedStoreId) {
        return res
          .status(403)
          .json({ mesaj: "Nu esti asignat acestui magazin." });
      }

      // Fetch customer's card
      const cardSql = `
      SELECT lc.points, lc.total_points_earned, u.firstName, u.lastName
      FROM loyalty_cards lc
      INNER JOIN users u ON u.id = lc.user_id
      WHERE lc.user_id = ? AND lc.store_id = ?
      LIMIT 1
    `;
      con.query(
        cardSql,
        [parsedCustomerId, parsedStoreId],
        (cardErr, cardRows) => {
          if (cardErr)
            return res.status(500).json({ mesaj: "Eroare la server" });

          if (!cardRows.length) {
            return res.status(404).json({
              mesaj: "Clientul nu are card de loialitate la acest magazin.",
            });
          }

          const card = cardRows[0];
          return res.json({
            points: Number(card.points),
            totalPointsEarned: Number(card.total_points_earned),
            clientName: [card.firstName, card.lastName]
              .filter(Boolean)
              .join(" "),
          });
        },
      );
    });
  },
);

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
          u.created_at   AS joined_at
        FROM store_staff ss
        INNER JOIN users u ON u.id = ss.user_id
        WHERE ss.store_id = ? AND u.role_id = 4
        ORDER BY u.created_at DESC
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

// POST /api/owner/baristas — create a new barista account and assign to the owner's store
app.post("/api/owner/baristas", verifyToken, async (req, res) => {
  if (req.user.role !== 3)
    return res.status(403).json({ mesaj: "Acces interzis." });

  const { firstName, lastName, email, password, phone } = req.body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return res
      .status(400)
      .json({ mesaj: "Prenumele și numele sunt obligatorii." });
  }
  if (!email?.trim()) {
    return res.status(400).json({ mesaj: "Email-ul este obligatoriu." });
  }
  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ mesaj: "Parola trebuie să aibă cel puțin 6 caractere." });
  }
  if (!phone?.trim()) {
    return res
      .status(400)
      .json({ mesaj: "Numărul de telefon este obligatoriu." });
  }

  // Resolve the owner's store
  con.query(
    "SELECT store_id FROM store_staff WHERE user_id = ?",
    [req.user.id],
    async (err, staffRows) => {
      if (err) return res.status(500).json({ mesaj: "Eroare la server." });
      if (!staffRows.length)
        return res
          .status(404)
          .json({ mesaj: "Nu ești asociat niciunui magazin." });

      const storeId = staffRows[0].store_id;

      // Hash the password
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, 10);
      } catch {
        return res.status(500).json({ mesaj: "Eroare la procesarea parolei." });
      }

      // Insert the new user with role_id = 4 (barista)
      const insertUserSql = `
        INSERT INTO users (role_id, firstName, lastName, email, password, phone)
        VALUES (4, ?, ?, ?, ?, ?)
      `;
      con.query(
        insertUserSql,
        [
          firstName.trim(),
          lastName.trim(),
          email.trim(),
          hashedPassword,
          phone.trim(),
        ],
        (insertErr, insertResult) => {
          if (insertErr) {
            if (insertErr.code === "ER_DUP_ENTRY") {
              return res
                .status(409)
                .json({ mesaj: "Email-ul sau telefonul este deja folosit." });
            }
            console.error(
              "Eroare MySQL la crearea contului (tabela users):",
              insertErr,
            );
            return res
              .status(500)
              .json({ mesaj: "Eroare la crearea contului." });
          }

          const newUserId = insertResult.insertId;

          // Link the new barista to the owner's store
          const insertStaffSql = `
            INSERT INTO store_staff (store_id, user_id) VALUES (?, ?)
          `;
          con.query(insertStaffSql, [storeId, newUserId], (staffErr) => {
            if (staffErr) {
              console.error(
                "Eroare MySQL la asignare (tabela store_staff):",
                staffErr,
              );
              // Roll back: delete the user we just created
              con.query(
                "DELETE FROM users WHERE id = ?",
                [newUserId],
                () => {},
              );
              return res
                .status(500)
                .json({ mesaj: "Eroare la asignarea baristului la magazin." });
            }

            res
              .status(201)
              .json({ succes: true, mesaj: "Barist adăugat cu succes!" });
          });
        },
      );
    },
  );
});

app.put("/api/owner/baristas/:id", verifyToken, (req, res) => {
  if (req.user.role !== 3)
    return res.status(403).json({ mesaj: "Acces interzis." });

  const { id } = req.params;
  const { firstName, lastName, email, phone } = req.body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return res
      .status(400)
      .json({ mesaj: "Prenumele și numele sunt obligatorii." });
  }

  // Verify the barista belongs to the owner's store
  con.query(
    "SELECT store_id FROM store_staff WHERE user_id = ?",
    [req.user.id],
    (err, staffRows) => {
      if (err) return res.status(500).json({ mesaj: "Eroare la server" });
      if (!staffRows.length)
        return res
          .status(404)
          .json({ mesaj: "Nu ești asociat niciunui magazin." });

      const storeId = staffRows[0].store_id;

      // Confirm the target user is a barista (role 4) in this store
      const checkSql = `
        SELECT ss.user_id FROM store_staff ss
        INNER JOIN users u ON u.id = ss.user_id
        WHERE ss.store_id = ? AND ss.user_id = ? AND u.role_id = 4
      `;
      con.query(checkSql, [storeId, id], (checkErr, checkRows) => {
        if (checkErr)
          return res.status(500).json({ mesaj: "Eroare la server" });
        if (!checkRows.length)
          return res
            .status(404)
            .json({ mesaj: "Baristul nu a fost găsit în magazinul tău." });

        const updateSql = `
          UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ?
          WHERE id = ?
        `;
        con.query(
          updateSql,
          [firstName.trim(), lastName.trim(), email || null, phone || null, id],
          (updateErr) => {
            if (updateErr)
              return res
                .status(500)
                .json({ mesaj: "Eroare la actualizarea baristului." });
            res.json({ succes: true, mesaj: "Barist actualizat cu succes!" });
          },
        );
      });
    },
  );
});

// DELETE — remove a barista from the store
app.delete("/api/owner/baristas/:id", verifyToken, (req, res) => {
  if (req.user.role !== 3)
    return res.status(403).json({ mesaj: "Acces interzis." });

  const { id } = req.params;

  // Verify the barista belongs to the owner's store
  con.query(
    "SELECT store_id FROM store_staff WHERE user_id = ?",
    [req.user.id],
    (err, staffRows) => {
      if (err) return res.status(500).json({ mesaj: "Eroare la server" });
      if (!staffRows.length)
        return res
          .status(404)
          .json({ mesaj: "Nu ești asociat niciunui magazin." });

      const storeId = staffRows[0].store_id;

      // Remove from store_staff and revert role to regular user (role 2)
      const deleteSql =
        "DELETE FROM store_staff WHERE store_id = ? AND user_id = ?";
      con.query(deleteSql, [storeId, id], (deleteErr, deleteResult) => {
        if (deleteErr)
          return res.status(500).json({ mesaj: "Eroare la ștergere." });
        if (deleteResult.affectedRows === 0)
          return res
            .status(404)
            .json({ mesaj: "Baristul nu a fost găsit în magazinul tău." });

        // Revert role to regular user
        con.query(
          "UPDATE users SET role_id = 2 WHERE id = ? AND role_id = 4",
          [id],
          () => {
            // Role revert is best-effort; respond success regardless
            res.json({ succes: true, mesaj: "Barist eliminat cu succes!" });
          },
        );
      });
    },
  );
});

// GET /api/menu/store/:storeId - Get menu categories and items for a store
app.get("/api/menu/store/:storeId", verifyToken, (req, res) => {
  const { storeId } = req.params;
  const parsedStoreId = Number(storeId);

  if (!Number.isInteger(parsedStoreId) || parsedStoreId <= 0) {
    return res.status(400).json({ mesaj: "Store ID invalid." });
  }

  // Get all menu categories for this store with their items
  const sql = `
    SELECT 
      mc.id,
      mc.store_id,
      mc.name as category_name,
      mc.slug,
      mc.display_order,
      mi.id as item_id,
      mi.name as item_name,
      mi.description,
      mi.price,
      mi.available
    FROM menu_categories mc
    LEFT JOIN menu_items mi ON mi.category_id = mc.id
    WHERE mc.store_id = ?
    ORDER BY mc.display_order ASC, mi.name ASC
  `;

  con.query(sql, [parsedStoreId], (err, results) => {
    if (err) {
      console.error("[menu/store] query error:", err);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }

    if (results.length === 0) {
      return res.json({
        hasMenu: false,
        categories: [],
      });
    }

    // Organize results by category
    const categoriesMap = {};
    results.forEach((row) => {
      if (!categoriesMap[row.id]) {
        categoriesMap[row.id] = {
          id: row.id,
          name: row.category_name,
          slug: row.slug,
          displayOrder: row.display_order,
          items: [],
        };
      }

      if (row.item_id) {
        categoriesMap[row.id].items.push({
          id: row.item_id,
          name: row.item_name,
          description: row.description,
          price: parseFloat(row.price),
          available: row.available === 1,
        });
      }
    });

    const categories = Object.values(categoriesMap);

    res.json({
      hasMenu: true,
      categories,
    });
  });
});

// GET /api/owner/menu - Get all menu items for owner's store
app.get("/api/owner/menu", verifyToken, (req, res) => {
  if (req.user.role !== 3)
    return res.status(403).json({ mesaj: "Acces interzis." });

  con.query(
    "SELECT store_id FROM store_staff WHERE user_id = ?",
    [req.user.id],
    (err, staffRows) => {
      if (err) return res.status(500).json({ mesaj: "Eroare la server" });
      if (!staffRows.length)
        return res
          .status(403)
          .json({ mesaj: "Nu ești asociat niciunui magazin." });

      const store_id = staffRows[0].store_id;

      const sql = `
        SELECT 
          mi.id, mi.store_id, mi.category_id, mi.name, mi.description, mi.price, mi.available,
          mc.name as category_name, mc.slug as category_slug
        FROM menu_items mi
        LEFT JOIN menu_categories mc ON mc.id = mi.category_id
        WHERE mi.store_id = ?
        ORDER BY mc.display_order ASC, mi.name ASC
      `;

      con.query(sql, [store_id], (qErr, results) => {
        if (qErr) {
          console.error("[owner/menu] query error:", qErr);
          return res.status(500).json({ mesaj: "Eroare la server" });
        }

        const items = results.map((row) => ({
          id: row.id,
          storeId: row.store_id,
          categoryId: row.category_id,
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          available: row.available === 1,
          categoryName: row.category_name,
          categorySlug: row.category_slug,
        }));

        res.json({ success: true, items });
      });
    },
  );
});

// PUT /api/owner/menu/:id - Update a menu item
app.put("/api/owner/menu/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { store_id } = req.user;
  const { name, description, price, available } = req.body;

  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({ mesaj: "Item ID invalid." });
  }

  if (!name || typeof name !== "string") {
    return res.status(400).json({ mesaj: "Product name is required." });
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ mesaj: "Valid price is required." });
  }

  // Check if item belongs to owner's store
  const checkSql = `
    SELECT mi.id, mi.store_id
    FROM menu_items mi
    WHERE mi.id = ? AND mi.store_id = ?
    LIMIT 1
  `;

  con.query(checkSql, [parsedId, store_id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("[menu update] check error:", checkErr);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }

    if (!checkResults.length) {
      return res
        .status(404)
        .json({ mesaj: "Item not found or access denied." });
    }

    const updateSql = `
      UPDATE menu_items
      SET name = ?, description = ?, price = ?, available = ?
      WHERE id = ? AND store_id = ?
    `;

    con.query(
      updateSql,
      [
        name.trim(),
        (description || "").trim(),
        parsedPrice,
        available ? 1 : 0,
        parsedId,
        store_id,
      ],
      (updateErr) => {
        if (updateErr) {
          console.error("[menu update] update error:", updateErr);
          return res.status(500).json({ mesaj: "Eroare la server" });
        }

        res.json({
          succes: true,
          mesaj: "Produs actualizat cu succes.",
        });
      },
    );
  });
});

// DELETE /api/owner/menu/:id - Delete a menu item
app.delete("/api/owner/menu/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { store_id } = req.user;

  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({ mesaj: "Item ID invalid." });
  }

  // Check if item belongs to owner's store
  const checkSql = `
    SELECT mi.id, mi.store_id
    FROM menu_items mi
    WHERE mi.id = ? AND mi.store_id = ?
    LIMIT 1
  `;

  con.query(checkSql, [parsedId, store_id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("[menu delete] check error:", checkErr);
      return res.status(500).json({ mesaj: "Eroare la server" });
    }

    if (!checkResults.length) {
      return res
        .status(404)
        .json({ mesaj: "Item not found or access denied." });
    }

    const deleteSql = `
      DELETE FROM menu_items
      WHERE id = ? AND store_id = ?
    `;

    con.query(deleteSql, [parsedId, store_id], (deleteErr) => {
      if (deleteErr) {
        console.error("[menu delete] delete error:", deleteErr);
        return res.status(500).json({ mesaj: "Eroare la server" });
      }

      res.json({
        succes: true,
        mesaj: "Produs șters cu succes.",
      });
    });
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

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`CoffeeShop backend listening on port ${PORT}`);
  });
}

export { app };
