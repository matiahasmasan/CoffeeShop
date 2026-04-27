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

// Mock for MySQL
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
  
  // valid tokends for admin and user
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

describe("Validări și Funcționalitate - Magazine", () => {
  test("Admin primește 400 dacă lipsește numele la adăugarea unui magazin", async () => {
    const res = await request(app)
      .post("/api/stores")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ address: "Strada Fără Nume" }); // lipsește 'name'
    
    expect(res.status).toBe(400);
    expect(res.body.mesaj).toBe("Numele și adresa sunt obligatorii.");
  });

  test("Admin primește 400 dacă lipsește adresa la modificarea unui magazin", async () => {
    const res = await request(app)
      .put("/api/stores/1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Cafenea Nouă" }); // lipsește 'address'
      
    expect(res.status).toBe(400);
    expect(res.body.mesaj).toBe("Numele și adresa sunt obligatorii.");
  });

  test("GET magazin inexistent returnează 404 Not Found", async () => {
    // Datorită modului în care am făcut mock la baza de date (returnează mereu []), 
    // orice request după ID ar trebui să pice elegant în 404.
    const res = await request(app)
      .get("/api/stores/9999")
      .set("Authorization", `Bearer ${userToken}`);
      
    expect(res.status).toBe(404);
    expect(res.body.mesaj).toBe("Store nu a fost gasit");
  });

  test("Asignare personal: eroare 400 dacă lipsesc datele", async () => {
    const res = await request(app)
      .post("/api/store-staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ store_id: 1 }); // lipsește 'user_id'
      
    expect(res.status).toBe(400);
    expect(res.body.mesaj).toBe("user_id și store_id sunt obligatorii.");
  });
});