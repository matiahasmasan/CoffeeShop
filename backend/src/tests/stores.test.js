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

// Mock pentru MySQL
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
  
  // Generăm token-uri valide pe care să le folosim în request-uri
  adminToken = jwt.sign({ id: 1, email: "admin@test.com", role: 1 }, JWT_SECRET, { expiresIn: "1h" });
  userToken = jwt.sign({ id: 2, email: "user@test.com", role: 2 }, JWT_SECRET, { expiresIn: "1h" });
});

describe("Autorizare (RBAC) - Magazine", () => {
  test("User standard (rol 2) primește 403 la adăugarea unui magazin", async () => {
    const res = await request(app)
      .post("/api/stores")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Test Store", address: "123 Test St" });
    
    expect(res.status).toBe(403);
    expect(res.body.mesaj).toBe("Acces interzis.");
  });

  test("User standard primește 403 la ștergerea unui magazin", async () => {
    const res = await request(app)
      .delete("/api/stores/1")
      .set("Authorization", `Bearer ${userToken}`);
      
    expect(res.status).toBe(403);
  });

  test("User standard primește 403 la asignarea personalului (store-staff)", async () => {
    const res = await request(app)
      .post("/api/store-staff")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ user_id: 2, store_id: 1 });
      
    expect(res.status).toBe(403);
  });
});