import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { createReviewSchema, reviewQuerySchema } from "../validations/reviewValidation.js";

const router = express.Router();

// GET /api/reviews/mine — must be BEFORE /:productId routes to avoid
// "mine" being parsed as a productId
router.get("/mine", requireAuth, reviewController.getMyReviews);

// Reviews are nested under products: /api/reviews/:productId/...
// This keeps the URL structure RESTful — a review belongs to a product.

// Public: anyone can read reviews
router.get(
  "/:productId",
  validateQuery(reviewQuerySchema),
  reviewController.getProductReviews
);

// Auth required: only logged-in users can submit or delete
router.post("/:productId", requireAuth, validate(createReviewSchema), reviewController.createReview);

// DELETE: users delete their own; admins can delete any (checked inside the service)
router.delete("/:productId/:reviewId", requireAuth, reviewController.deleteReview);

export default router;
