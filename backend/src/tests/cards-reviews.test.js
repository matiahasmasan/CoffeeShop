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
let userToken;

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
  // Generăm un token de utilizator normal pentru a testa rutele
  userToken = jwt.sign({ id: 2, email: "user@test.com", role: 2 }, JWT_SECRET, { expiresIn: "1h" });
});

describe("Validare și Funcționalitate - Review-uri", () => {
  test("Returnează 400 dacă rating-ul este invalid (ex: 6)", async () => {
    const res = await request(app)
      .post("/api/reviews/1")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 6, comment: "Prea bun!" });

    expect(res.status).toBe(400);
    expect(res.body.mesaj).toBe("Rating trebuie să fie între 1 și 5.");
  });

  test("Adaugă review cu date valide", async () => {
    const res = await request(app)
      .post("/api/reviews/1")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5, comment: "Cafea excelentă!" });

    expect(res.status).toBe(201);
    expect(res.body.succes).toBe(true);
  });
});

describe("Validare - Carduri de Fidelitate", () => {
  test("Revendicarea unui card returnează 201", async () => {
    const res = await request(app)
      .post("/api/cards/claim")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ store_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.succes).toBe(true);
  });
});