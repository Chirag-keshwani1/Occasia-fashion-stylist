import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import { connectTestDb, disconnectTestDb, clearDatabase } from "./testSetup.js";
import Product from "../models/Product.js";

beforeAll(async () => {
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

const makeProduct = (overrides = {}) =>
  Product.create({
    name: "Classic Tee",
    brand: "TestBrand",
    description: "A soft cotton t-shirt",
    price: 999,
    category: "top",
    colorFamily: "blue",
    formalityLevel: 2,
    gender: "unisex",
    seasonTags: ["summer"],
    occasionTags: ["casual"],
    images: ["https://example.com/tee.jpg"],
    variants: [{ size: "M", stock: 10 }],
    isActive: true,
    ...overrides,
  });

describe("Similar Products Endpoints Regression", () => {
  it("GET /api/products/:id/similar returns similar products by product id", async () => {
    const main = await makeProduct({ name: "Main Tee", category: "top" });
    const similar = await makeProduct({ name: "Similar Tee", category: "top" });

    const res = await request(app).get(`/api/products/${main._id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0]._id.toString()).toBe(similar._id.toString());
  });

  it("GET /api/recommendations/similar/:productId returns similar products by productId", async () => {
    const main = await makeProduct({ name: "Main Tee", category: "top" });
    const similar = await makeProduct({ name: "Similar Tee", category: "top" });

    const res = await request(app).get(`/api/recommendations/similar/${main._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0]._id.toString()).toBe(similar._id.toString());
  });

  it("returns 404 for non-existent product on both endpoints", async () => {
    const fakeId = "60c72b2f9b1d8b2badbee555";
    const res1 = await request(app).get(`/api/products/${fakeId}/similar`);
    const res2 = await request(app).get(`/api/recommendations/similar/${fakeId}`);

    expect(res1.status).toBe(404);
    expect(res2.status).toBe(404);
  });
});
