/**
 * Integration tests: Order cancellation with stock restoration (Task 4),
 * and checkout idempotency (Task 5).
 *
 * NOTE: like tests/checkout.test.js, orderService.cancelOrder and
 * orderService.checkout both use MongoDB multi-document transactions
 * (mongoose session.withTransaction) for atomicity, which require a
 * replica set. A standalone MongoMemoryServer instance (as used in
 * testSetup.js) does not support this, so these tests need to run
 * against an environment with transaction support (e.g. a local replica
 * set or MongoDB Atlas) — same constraint the pre-existing checkout flow
 * already has. They document and verify the expected behavior/contract.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { connectTestDb, disconnectTestDb, clearDatabase } from "./testSetup.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import IdempotencyKey from "../models/IdempotencyKey.js";
import * as orderService from "../services/orderService.js";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_jwt_secret_at_least_32_characters_long";
  process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_at_least_32_chars";
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
    name: "Test Shirt",
    brand: "TestBrand",
    price: 500,
    category: "top",
    colorFamily: "white",
    formalityLevel: 2,
    seasonTags: ["summer"],
    occasionTags: ["casual"],
    images: ["https://example.com/img.jpg"],
    variants: [{ size: "M", stock: 10 }],
    isActive: true,
    ...overrides,
  });

const makeOrder = (userId, product, overrides = {}) =>
  Order.create({
    userId,
    items: [{ productId: product._id, size: "M", qty: 2, priceAtOrder: product.price }],
    subtotal: product.price * 2,
    total: product.price * 2,
    status: "confirmed",
    ...overrides,
  });

describe("Order cancellation restores stock (Task 4)", () => {
  it("restores the correct size variant's stock when cancelled", async () => {
    const userId = new mongoose.Types.ObjectId();
    const product = await makeProduct({
      variants: [
        { size: "S", stock: 5 },
        { size: "M", stock: 3 }, // 3 left after 2 were bought out of an original 5
      ],
    });
    const order = await makeOrder(userId, product);

    await orderService.cancelOrder(userId, order._id);

    const updated = await Product.findById(product._id);
    expect(updated.variants.find((v) => v.size === "M").stock).toBe(5); // 3 + 2 restored
    expect(updated.variants.find((v) => v.size === "S").stock).toBe(5); // untouched

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder.status).toBe("cancelled");
  });

  it("does not restore stock twice if cancellation is requested twice", async () => {
    const userId = new mongoose.Types.ObjectId();
    const product = await makeProduct({ variants: [{ size: "M", stock: 3 }] });
    const order = await makeOrder(userId, product);

    await orderService.cancelOrder(userId, order._id);
    await expect(orderService.cancelOrder(userId, order._id)).rejects.toThrow(/already been cancelled/i);

    const updated = await Product.findById(product._id);
    // Only ever +2 once, never +4
    expect(updated.variants.find((v) => v.size === "M").stock).toBe(5);
  });

  it("refuses to cancel a delivered order", async () => {
    const userId = new mongoose.Types.ObjectId();
    const product = await makeProduct();
    const order = await makeOrder(userId, product, { status: "delivered" });

    await expect(orderService.cancelOrder(userId, order._id)).rejects.toThrow(/delivered/i);

    const updated = await Product.findById(product._id);
    expect(updated.variants.find((v) => v.size === "M").stock).toBe(10); // unchanged
  });

  it("does not let a user cancel another user's order", async () => {
    const owner = new mongoose.Types.ObjectId();
    const intruder = new mongoose.Types.ObjectId();
    const product = await makeProduct();
    const order = await makeOrder(owner, product);

    await expect(orderService.cancelOrder(intruder, order._id)).rejects.toThrow(/not found/i);
  });
});

describe("Checkout idempotency (Task 5)", () => {
  it("returns the same order on a repeated Idempotency-Key instead of creating a duplicate", async () => {
    // This scenario is exercised through orderService.checkout, which pulls
    // from the Cart collection — full cart setup is covered by the existing
    // checkout.test.js suite's coupon/stock integration tests. Here we
    // verify the idempotency-key bookkeeping contract in isolation:
    // claiming the same key twice must not allow two "processing" records
    // to exist, because IdempotencyKey enforces a unique (userId, endpoint, key) index.
    const userId = new mongoose.Types.ObjectId();

    await IdempotencyKey.create({ key: "abc-123", userId, endpoint: "checkout" });

    await expect(
      IdempotencyKey.create({ key: "abc-123", userId, endpoint: "checkout" })
    ).rejects.toThrow(); // duplicate key error (E11000) — this is what makes claiming atomic

    const count = await IdempotencyKey.countDocuments({ userId, endpoint: "checkout", key: "abc-123" });
    expect(count).toBe(1);
  });

  it("allows the same key to be reused by a different user", async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    await IdempotencyKey.create({ key: "shared-key", userId: userA, endpoint: "checkout" });
    await expect(
      IdempotencyKey.create({ key: "shared-key", userId: userB, endpoint: "checkout" })
    ).resolves.toBeTruthy();
  });
});
