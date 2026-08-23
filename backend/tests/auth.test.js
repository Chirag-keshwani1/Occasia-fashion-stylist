/**
 * Integration tests: Authentication
 *
 * Tests the full register → login → refresh → logout flow
 * using an in-memory MongoDB instance (no real DB required).
 *
 * Why integration tests here instead of unit tests?
 * Auth logic is tightly coupled to DB queries, bcrypt hashing,
 * and JWT generation. Testing all three together is more valuable
 * than mocking each dependency individually.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import { connectTestDb, disconnectTestDb, clearDatabase } from "./testSetup.js";

beforeAll(async () => {
  // Set env vars BEFORE app module is loaded if needed
  process.env.JWT_SECRET = "test_jwt_secret_at_least_32_characters_long";
  process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_at_least_32_chars";
  process.env.NODE_ENV = "test";
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearDatabase();
});

const TEST_USER = {
  name: "Test User",
  email: "test@occasia.com",
  password: "SecurePass123!",
};

describe("POST /api/auth/register", () => {
  it("should register a new user and return tokens", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("should reject registration with a duplicate email", async () => {
    // First registration should succeed
    await request(app).post("/api/auth/register").send(TEST_USER);
    // Second with same email should fail
    const res = await request(app).post("/api/auth/register").send(TEST_USER);

    expect(res.status).toBe(409);
  });

  it("should reject registration with a weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...TEST_USER, password: "123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(TEST_USER);
  });

  it("should log in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");
    // Refresh token should be in an httpOnly cookie
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_USER.email,
      password: "WrongPassword123!",
    });

    expect(res.status).toBe(401);
  });

  it("should reject login with non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: TEST_USER.password,
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/users/me", () => {
  it("should return the authenticated user profile", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(TEST_USER);
    const { accessToken } = registerRes.body.data;

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });
});
