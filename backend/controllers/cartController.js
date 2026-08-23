import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as cartService from "../services/cartService.js";

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCartWithDetails(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, cart, "Cart fetched");
});

export const addItem = asyncHandler(async (req, res) => {
  await cartService.addItem(req.user.id, req.body);
  const cart = await cartService.getCartWithDetails(req.user.id);
  sendResponse(res, HTTP_STATUS.CREATED, cart, "Item added to cart");
});

export const updateItemQty = asyncHandler(async (req, res) => {
  const { productId, size } = req.params;
  await cartService.updateItemQty(req.user.id, productId, size, req.body.qty);
  const cart = await cartService.getCartWithDetails(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, cart, "Cart updated");
});

export const removeItem = asyncHandler(async (req, res) => {
  const { productId, size } = req.params;
  await cartService.removeItem(req.user.id, productId, size);
  const cart = await cartService.getCartWithDetails(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, cart, "Item removed from cart");
});
