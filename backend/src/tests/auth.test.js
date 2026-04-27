import { describe, test, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../server.js";

const mockQuery = vi.hoisted(() =>
  vi.fn((_sql, paramsOrCb, cb) => {
    if (typeof paramsOrCb === "function") paramsOrCb(null, []);
    else cb(null, []);
  })
);

// Mock pentru MySQL - nu vrem sa ne conectam la baza de date reala in teste
vi.mock("mysql", () => {
  return {
    default: {
      createConnection: () => ({
        connect: (cb) => cb(null),
        query: mockQuery,
      }),
    },
  };
});

const JWT_SECRET = "test_secret";
let adminToken;
let userToken;

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
  adminToken = jwt.sign({ id: 1, email: "admin@test.com", role: 1 }, JWT_SECRET, { expiresIn: "1h" });
  userToken = jwt.sign({ id: 2, email: "user@test.com", role: 2 }, JWT_SECRET, { expiresIn: "1h" });
});

// ─── verifyToken ────────────────────────────────────────────────────────────

describe("verifyToken", () => {
  test("returneaza 403 daca lipseste token-ul", async () => {
    const res = await request(app).get("/api/stores");
    expect(res.status).toBe(403);
    expect(res.body.mesaj).toBe("Acces interzis. Lipseste token-ul.");
  });

  test("returneaza 401 daca token-ul este invalid", async () => {
    const res = await request(app)
      .get("/api/stores")
      .set("Authorization", "Bearer token_invalid");
    expect(res.status).toBe(401);
    expect(res.body.mesaj).toBe("Token invalid sau expirat.");
  });

  test("returneaza 401 daca token-ul a fost emis inainte de restart", async () => {
    // Token emis in trecut (cu iat in urma cu 2 ore)
    const tokenVechi = jwt.sign(
      { id: 1, email: "test@test.com", role: 2, iat: Math.floor(Date.now() / 1000) - 7200 },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/api/stores")
      .set("Authorization", `Bearer ${tokenVechi}`);
    expect(res.status).toBe(401);
  });

  test("accepta token valid emis dupa pornirea serverului", async () => {
    const tokenValid = jwt.sign(
      { id: 1, email: "test@test.com", role: 2 },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/api/stores")
      .set("Authorization", `Bearer ${tokenValid}`);

    // 200 sau 500 (500 = baza de date mock) — important e ca NU e 401/403
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

// ─── GET /api/qr-token ───────────────────────────────────────────────────────

describe("GET /api/qr-token", () => {
  test("returneaza qr_token cu token valid", async () => {
    const tokenValid = jwt.sign(
      { id: 5, email: "test@test.com", role: 2 },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/api/qr-token")
      .set("Authorization", `Bearer ${tokenValid}`);

    expect(res.status).toBe(200);
    expect(res.body.qr_token).toBeDefined();
  });

  test("qr_token contine type: qr si userId corect", async () => {
    const tokenValid = jwt.sign(
      { id: 5, email: "test@test.com", role: 2 },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/api/qr-token")
      .set("Authorization", `Bearer ${tokenValid}`);

    const decoded = jwt.verify(res.body.qr_token, JWT_SECRET);
    expect(decoded.type).toBe("qr");
    expect(decoded.userId).toBe(5);
  });
});

// ─── POST /api/login ─────────────────────────────────────────────────────────

describe("POST /api/login", () => {
  test("returneaza 400 daca lipsesc campurile", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({});
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("blocheaza dupa 10 incercari cu 429", async () => {
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post("/api/login")
        .send({});
    }
    const res = await request(app)
        .post("/api/login")
        .send({});
      expect(res.status).toBe(429);
  });
});

// ─── POST /api/register ──────────────────────────────────────────────────────

describe("POST /api/register", () => {
  test("returneaza 201 cu date valide", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        firstName: "Ion",
        lastName: "Popescu",
        email: "ion@test.com",
        password: "parola123",
        phone: "0712345678",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test("returneaza 500 la eroare de baza de date (ex: email duplicat)", async () => {
    mockQuery.mockImplementationOnce((_sql, _params, cb) => {
      cb(new Error("ER_DUP_ENTRY"), null);
    });

    const res = await request(app)
      .post("/api/register")
      .send({
        firstName: "Ion",
        lastName: "Popescu",
        email: "ion@test.com",
        password: "parola123",
        phone: "0712345678",
      });
    expect(res.status).toBe(500);
  });
});
