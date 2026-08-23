import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as productService from "../services/productService.js";
import { recordView } from "../services/recentlyViewedService.js";
import { logger } from "../config/logger.js";

export const listProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);
  sendResponse(res, HTTP_STATUS.OK, result, "Products fetched");
});

// GET /products/new-arrivals — recently added active products, paginated.
export const listNewArrivals = asyncHandler(async (req, res) => {
  const result = await productService.getNewArrivals(req.query);
  sendResponse(res, HTTP_STATUS.OK, result, "New arrivals fetched");
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  // Fire-and-forget: record the view for logged-in users.
  // We do NOT await this — recording a view is a best-effort side effect,
  // not critical to the response. If it fails (e.g. DB hiccup), the
  // product response still goes out successfully.
  if (req.user?.id) {
    recordView(req.user.id, product._id).catch((err) =>
      logger.warn(`Failed to record recently viewed: ${err.message}`)
    );
  }

  sendResponse(res, HTTP_STATUS.OK, { product }, "Product fetched");
});
