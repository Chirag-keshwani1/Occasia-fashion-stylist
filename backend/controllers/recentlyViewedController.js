import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as recentlyViewedService from "../services/recentlyViewedService.js";

// GET /api/recently-viewed
export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const items = await recentlyViewedService.getRecentlyViewed(req.user.id, limit);
  sendResponse(res, HTTP_STATUS.OK, { items }, "Recently viewed products fetched");
});

// DELETE /api/recently-viewed
export const clearRecentlyViewed = asyncHandler(async (req, res) => {
  await recentlyViewedService.clearRecentlyViewed(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, null, "Recently viewed history cleared");
});
