import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as couponService from "../services/couponService.js";

// POST /api/coupons/validate — user validates a code before checkout
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;
  const result = await couponService.validateCoupon(
    code,
    req.user?.id,
    cartTotal,
    [] // cart items not provided here; category restrictions checked at checkout
  );
  sendResponse(res, HTTP_STATUS.OK, {
    code: result.coupon.code,
    type: result.coupon.type,
    value: result.coupon.value,
    discount: result.discount,
    finalTotal: result.finalTotal,
    description: result.coupon.description,
  }, "Coupon is valid");
});

// Admin: POST /api/admin/coupons
export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body, req.user.id);
  sendResponse(res, HTTP_STATUS.CREATED, { coupon }, "Coupon created");
});

// Admin: GET /api/admin/coupons
export const getCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isActive } = req.query;
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";
  const result = await couponService.getCoupons({ page: parseInt(page), limit: parseInt(limit), ...filter });
  sendResponse(res, HTTP_STATUS.OK, result, "Coupons fetched");
});

// Admin: PATCH /api/admin/coupons/:id/deactivate
export const deactivateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.deactivateCoupon(req.params.id);
  sendResponse(res, HTTP_STATUS.OK, { coupon }, "Coupon deactivated");
});
