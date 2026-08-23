import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as orderService from "../services/orderService.js";

export const checkout = asyncHandler(async (req, res) => {
  const { couponCode, shippingAddress } = req.body;
  // Optional client-supplied key (standard "Idempotency-Key" header) — see
  // orderService.checkout for how repeated keys are deduplicated.
  const idempotencyKey = req.header("Idempotency-Key") || undefined;
  const order = await orderService.checkout(req.user.id, { couponCode, shippingAddress, idempotencyKey });
  sendResponse(res, HTTP_STATUS.CREATED, { order }, "Order placed successfully");
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user.id, req.params.id);
  sendResponse(res, HTTP_STATUS.OK, { order }, "Order cancelled and stock restored");
});


export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, { orders }, "Orders fetched");
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user.id, req.params.id);
  sendResponse(res, HTTP_STATUS.OK, { order }, "Order fetched");
});

// --- Admin ---

export const getAllOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getAllOrders(req.query);
  sendResponse(res, HTTP_STATUS.OK, result, "Orders fetched");
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  sendResponse(res, HTTP_STATUS.OK, { order }, "Order status updated");
});
