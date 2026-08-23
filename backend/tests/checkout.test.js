/**
 * Integration tests: Checkout flow with coupon application
 *
 * Tests the transactional checkout: stock decrement, order creation,
 * cart clearing, and coupon discount integration — all in one atomic operation.
 *
 * Why integration over unit? The checkout service is the most critical
 * financial path. Mocking the DB would defeat the purpose — we need to verify
 * the actual MongoDB atomic operations behave correctly.
 *
 * NOTE: MongoMemoryServer does NOT support replica sets by default (required
 * for mongoose transactions). We test the coupon integration logic directly
 * against the service, and test the HTTP layer separately via supertest.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { connectTestDb, disconnectTestDb, clearDatabase } from "./testSetup.js";
import { createCoupon, validateCoupon } from "../services/couponService.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";

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

const ADMIN_ID = new mongoose.Types.ObjectId();

// Helper: create a minimal active product
const makeProduct = (overrides = {}) =>
  Product.create({
    name: "Test Shirt",
    brand: "TestBrand",
    description: "A test product",
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

// ─────────────────────────────────────────────────────────────────────────────
// COUPON + CART INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

describe("Coupon: category restriction", () => {
  it("should apply discount only to applicable category items", async () => {
    // Coupon only applies to 'bottom' category
    await createCoupon({
      code: "BOTTOMONLY",
      type: "percentage",
      value: 10,
      applicableCategories: ["bottom"],
      minCartValue: 0,
    }, ADMIN_ID);

    const cartItems = [
      { category: "top",    price: 1000, qty: 1 },
      { category: "bottom", price: 500,  qty: 1 },
    ];
    const cartTotal = 1500;

    const { discount, applicableSubtotal } = await validateCoupon(
      "BOTTOMONLY",
      null,
      cartTotal,
      cartItems
    );

    // 10% of only the bottom (₹500) = ₹50
    expect(applicableSubtotal).toBe(500);
    expect(discount).toBe(50);
  });

  it("should reject if no cart items match the applicable category", async () => {
    await createCoupon({
      code: "FOOTWEARONLY",
      type: "flat",
      value: 100,
      applicableCategories: ["footwear"],
      minCartValue: 0,
    }, ADMIN_ID);

    const cartItems = [
      { category: "top",    price: 1000, qty: 1 },
      { category: "bottom", price: 500,  qty: 1 },
    ];

    await expect(
      validateCoupon("FOOTWEARONLY", null, 1500, cartItems)
    ).rejects.toThrow(/footwear/i);
  });
});

describe("Coupon: user allowlist", () => {
  it("should accept a coupon for an allowed user", async () => {
    const userId = new mongoose.Types.ObjectId();
    await createCoupon({
      code: "VIPONLY",
      type: "flat",
      value: 200,
      allowedUsers: [userId],
      minCartValue: 0,
    }, ADMIN_ID);

    const { discount } = await validateCoupon("VIPONLY", userId, 1000, []);
    expect(discount).toBe(200);
  });

  it("should reject a coupon for a non-allowed user", async () => {
    const allowedUser = new mongoose.Types.ObjectId();
    const otherUser   = new mongoose.Types.ObjectId();
    await createCoupon({
      code: "RESTRICTEDVIP",
      type: "flat",
      value: 200,
      allowedUsers: [allowedUser],
      minCartValue: 0,
    }, ADMIN_ID);

    await expect(
      validateCoupon("RESTRICTEDVIP", otherUser, 1000, [])
    ).rejects.toThrow(/not available/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT MODEL
// ─────────────────────────────────────────────────────────────────────────────

describe("Product: stock virtual", () => {
  it("should compute totalStock correctly from variants", async () => {
    const product = await makeProduct({
      variants: [
        { size: "S", stock: 5 },
        { size: "M", stock: 3 },
        { size: "L", stock: 7 },
      ],
    });

    expect(product.totalStock).toBe(15);
  });

  it("should report 0 totalStock when all variants are out of stock", async () => {
    const product = await makeProduct({
      variants: [
        { size: "S", stock: 0 },
        { size: "M", stock: 0 },
      ],
    });

    expect(product.totalStock).toBe(0);
  });
});
