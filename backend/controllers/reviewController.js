import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as reviewService from "../services/reviewService.js";

// POST /api/products/:productId/reviews
export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.params.productId, req.user.id, req.body);
  sendResponse(res, HTTP_STATUS.CREATED, { review }, "Review submitted successfully");
});

// GET /api/products/:productId/reviews
export const getProductReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getProductReviews(req.params.productId, req.query);
  sendResponse(res, HTTP_STATUS.OK, result, "Reviews fetched");
});

// DELETE /api/products/:productId/reviews/:reviewId  (user — own reviews only)
// DELETE /api/admin/reviews/:id                       (admin — any review)
export const deleteReview = asyncHandler(async (req, res) => {
  // Support both param name conventions: :reviewId (user routes) and :id (admin routes)
  const reviewId = req.params.reviewId || req.params.id;
  const isAdmin = req.user.role === "admin";
  await reviewService.deleteReview(reviewId, req.user.id, isAdmin);
  sendResponse(res, HTTP_STATUS.OK, null, "Review deleted");
});


// GET /api/reviews/mine  — a user's own review history
export const getMyReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getUserReviews(req.user.id, req.query);
  sendResponse(res, HTTP_STATUS.OK, result, "Your reviews fetched");
});
