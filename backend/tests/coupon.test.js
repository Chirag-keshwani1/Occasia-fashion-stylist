/**
 * Integration tests: Coupon Validation
 *
 * Tests the core coupon business logic: validation, discount calculation,
 * expiry checking, and usage limits. These are some of the most financially
 * critical paths in the backend — any bug here costs real money.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { connectTestDb, disconnectTestDb, clearDatabase } from "./testSetup.js";
import { validateCoupon, createCoupon } from "../services/couponService.js";
import mongoose from "mongoose";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearDatabase();
});

// Fake admin ObjectId for createdBy field
const ADMIN_ID = new mongoose.Types.ObjectId();

describe("Coupon: flat discount", () => {
  it("should apply a flat ₹200 discount", async () => {
    await createCoupon({ code: "FLAT200", type: "flat", value: 200, minCartValue: 0 }, ADMIN_ID);
    const { discount, finalTotal } = await validateCoupon("FLAT200", null, 1000, []);

    expect(discount).toBe(200);
    expect(finalTotal).toBe(800);
  });

  it("should not discount more than the cart total", async () => {
    await createCoupon({ code: "FLAT5000", type: "flat", value: 5000, minCartValue: 0 }, ADMIN_ID);
    const { discount, finalTotal } = await validateCoupon("FLAT5000", null, 500, []);

    expect(discount).toBe(500); // capped at cart total
    expect(finalTotal).toBe(0);
  });
});

describe("Coupon: percentage discount", () => {
  it("should apply a 20% discount", async () => {
    await createCoupon({ code: "SAVE20", type: "percentage", value: 20, minCartValue: 0 }, ADMIN_ID);
    const { discount, finalTotal } = await validateCoupon("SAVE20", null, 1000, []);

    expect(discount).toBe(200);
    expect(finalTotal).toBe(800);
  });

  it("should cap percentage discount at maxDiscount", async () => {
    await createCoupon({
      code: "CAP100",
      type: "percentage",
      value: 50,
      maxDiscount: 100,
      minCartValue: 0,
    }, ADMIN_ID);
    const { discount } = await validateCoupon("CAP100", null, 1000, []);

    expect(discount).toBe(100); // 50% of 1000 = 500, capped at 100
  });
});

describe("Coupon: validation rules", () => {
  it("should reject expired coupons", async () => {
    await createCoupon({
      code: "EXPIRED",
      type: "flat",
      value: 100,
      expiresAt: new Date("2020-01-01"),
    }, ADMIN_ID);

    await expect(validateCoupon("EXPIRED", null, 1000, [])).rejects.toThrow("expired");
  });

  it("should reject if cart is below minimum value", async () => {
    await createCoupon({ code: "MIN500", type: "flat", value: 50, minCartValue: 500 }, ADMIN_ID);

    await expect(validateCoupon("MIN500", null, 200, [])).rejects.toThrow(/minimum/i);
  });

  it("should reject non-existent coupon codes", async () => {
    await expect(validateCoupon("DOESNOTEXIST", null, 1000, [])).rejects.toThrow(/not found/i);
  });

  it("should reject deactivated coupons", async () => {
    await createCoupon({ code: "INACTIVE", type: "flat", value: 100, isActive: false }, ADMIN_ID);

    await expect(validateCoupon("INACTIVE", null, 1000, [])).rejects.toThrow(/not found/i);
  });

  it("should reject when usage limit is reached", async () => {
    // Create a coupon that allows exactly 1 use
    await createCoupon({ code: "LIMITED", type: "flat", value: 50, usageLimit: 1 }, ADMIN_ID);

    // Simulate it having already been used once (timesUsed now equals usageLimit)
    const Coupon = (await import("../models/Coupon.js")).default;
    await Coupon.updateOne({ code: "LIMITED" }, { timesUsed: 1 });

    await expect(validateCoupon("LIMITED", null, 1000, [])).rejects.toThrow(/usage limit/i);
  });
});
