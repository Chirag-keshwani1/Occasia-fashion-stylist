import express from "express";
import * as couponController from "../controllers/couponController.js";
import { requireAuth } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { validateCouponSchema } from "../validations/couponValidation.js";

const router = express.Router();

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     tags: [Coupons]
 *     summary: Check if a coupon code is valid and get the discount amount
 *     description: Called from the cart page before checkout. Validates expiry, usage limits, and minimum cart value.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, cartTotal]
 *             properties:
 *               code: { type: string, example: "SAVE20" }
 *               cartTotal: { type: number, example: 2500 }
 *     responses:
 *       200:
 *         description: Coupon is valid — returns discount amount and final total
 *       400:
 *         description: Coupon expired, usage limit reached, or cart value too low
 *       404:
 *         description: Coupon not found
 */
router.post("/validate", optionalAuth, validate(validateCouponSchema), couponController.validateCoupon);

export default router;
