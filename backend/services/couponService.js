import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

/**
 * Validate a coupon code against a cart total and user context.
 * Returns the coupon document and the calculated discount amount.
 * Does NOT apply the coupon (that happens at checkout).
 */
export const validateCoupon = async (code, userId, cartTotal, cartItems = []) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });

  if (!coupon) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Coupon code not found or has been deactivated");
  }

  // ── Expiry check ──────────────────────────────────────────────────────────
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "This coupon has expired");
  }

  // ── Global usage limit ────────────────────────────────────────────────────
  if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "This coupon has reached its usage limit");
  }

  // ── Per-user usage limit ──────────────────────────────────────────────────
  if (userId) {
    const userUsageCount = await Order.countDocuments({ userId, "coupon.code": coupon.code });
    if (userUsageCount >= coupon.perUserLimit) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `You have already used this coupon the maximum number of times (${coupon.perUserLimit})`
      );
    }
  }

  // ── User allowlist check ──────────────────────────────────────────────────
  if (coupon.allowedUsers.length > 0) {
    const isAllowed = coupon.allowedUsers.some((u) => u.toString() === userId?.toString());
    if (!isAllowed) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, "This coupon is not available for your account");
    }
  }

  // ── Minimum cart value check ──────────────────────────────────────────────
  if (cartTotal < coupon.minCartValue) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `This coupon requires a minimum cart value of ₹${coupon.minCartValue}. Your cart total is ₹${cartTotal}.`
    );
  }

  // ── Category restriction ──────────────────────────────────────────────────
  // If the coupon restricts to specific categories, the applicable subtotal
  // is only the value of items in those categories.
  let applicableSubtotal = cartTotal;
  if (coupon.applicableCategories.length > 0 && cartItems.length > 0) {
    applicableSubtotal = cartItems
      .filter((item) => coupon.applicableCategories.includes(item.category))
      .reduce((sum, item) => sum + item.price * item.qty, 0);

    if (applicableSubtotal === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `This coupon only applies to: ${coupon.applicableCategories.join(", ")}`
      );
    }
  }

  // ── Calculate the discount amount ─────────────────────────────────────────
  let discount = 0;
  if (coupon.type === "flat") {
    discount = Math.min(coupon.value, applicableSubtotal); // can't discount more than the subtotal
  } else {
    discount = (applicableSubtotal * coupon.value) / 100;
    if (coupon.maxDiscount !== null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  }

  discount = Math.round(discount); // round to avoid floating point issues in monetary calcs

  return {
    coupon,
    discount,
    applicableSubtotal,
    finalTotal: cartTotal - discount,
  };
};

/**
 * Create a new coupon (admin only).
 */
export const createCoupon = async (data, adminId) => {
  try {
    const coupon = await Coupon.create({ ...data, createdBy: adminId });
    return coupon;
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(HTTP_STATUS.CONFLICT, `Coupon code "${data.code}" already exists`);
    }
    throw err;
  }
};

/**
 * List all coupons (admin only), with optional active/inactive filter.
 */
export const getCoupons = async ({ page = 1, limit = 20, isActive }) => {
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive;

  const skip = (page - 1) * limit;
  const [coupons, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);

  return { coupons, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

/**
 * Deactivate a coupon (soft disable — does not delete).
 */
export const deactivateCoupon = async (couponId) => {
  const coupon = await Coupon.findByIdAndUpdate(couponId, { isActive: false }, { new: true });
  if (!coupon) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Coupon not found");
  return coupon;
};

/**
 * Atomically increment the usage counter on a coupon after a successful checkout.
 * Uses $inc to avoid race conditions — two simultaneous checkouts can't both
 * push past the usage limit this way.
 */
export const incrementCouponUsage = async (code) => {
  await Coupon.updateOne({ code }, { $inc: { timesUsed: 1 } });
};
