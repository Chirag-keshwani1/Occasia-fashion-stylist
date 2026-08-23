import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as wishlistService from "../services/wishlistService.js";

export const addToWishlist = asyncHandler(async (req, res) => {
  await wishlistService.addToWishlist(req.user.id, req.params.productId);
  sendResponse(res, HTTP_STATUS.CREATED, null, "Added to wishlist");
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
  sendResponse(res, HTTP_STATUS.OK, null, "Removed from wishlist");
});

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, { wishlist }, "Wishlist fetched");
});
