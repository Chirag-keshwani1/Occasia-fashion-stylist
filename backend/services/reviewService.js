import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Maps sort option to a Mongoose sort object
const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highest: { rating: -1 },
  lowest: { rating: 1 },
};

/**
 * Recomputes a product's averageRating/reviewCount from the Review
 * collection and writes them onto the Product document. Called after every
 * review create/delete so ?sort=rating on Product Search can sort using a
 * plain indexed field instead of aggregating reviews on every search
 * request. Reuses the same $avg/$sum aggregation shape already used by
 * getProductReviews below, just without the star-distribution breakdown.
 */
const syncProductRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats ? parseFloat(stats.averageRating.toFixed(1)) : 0,
    reviewCount: stats ? stats.totalReviews : 0,
  });
};

/**
 * Submit a review for a product.
 * Rules:
 *  1. The product must exist and be active.
 *  2. The user must have a delivered order containing this product
 *     (verifiedPurchase). We still allow unverified reviews (future
 *     flexibility) but flag them differently.
 *  3. A user can only review each product once.
 */
export const createReview = async (productId, userId, data) => {
  // 1. Product must exist
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  // 2. Check for verified purchase — did this user order and receive this product?
  const verifiedOrder = await Order.findOne({
    userId,
    "items.productId": productId,
    status: "delivered",
  });

  // 3. Create the review — the unique compound index on (productId, userId)
  //    will reject duplicates at the database level even if two requests
  //    fire simultaneously, which is the safe way to handle this.
  try {
    const review = await Review.create({
      productId,
      userId,
      rating: data.rating,
      title: data.title,
      body: data.body,
      verifiedPurchase: !!verifiedOrder,
    });
    await syncProductRating(productId);
    return review;
  } catch (err) {
    // MongoDB duplicate key error code
    if (err.code === 11000) {
      throw new ApiError(HTTP_STATUS.CONFLICT, "You have already reviewed this product");
    }
    throw err;
  }
};

/**
 * Get paginated reviews for a product, along with the aggregate rating stats.
 * We compute the average and distribution in the same query batch so the
 * frontend gets everything it needs in one request.
 */
export const getProductReviews = async (productId, query) => {
  const { page, limit, sort } = query;

  // Confirm product exists before querying reviews
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  const skip = (page - 1) * limit;
  const sortObj = SORT_MAP[sort] || SORT_MAP.newest;

  // Fetch paginated reviews and the total count simultaneously
  const [reviews, total] = await Promise.all([
    Review.find({ productId })
      .populate("userId", "name") // show reviewer's name, nothing else
      .sort(sortObj)
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ productId }),
  ]);

  // Compute aggregate stats using MongoDB's aggregation pipeline.
  // This gives us the average rating and a breakdown like
  // { "5": 12, "4": 8, "3": 2, "2": 1, "1": 0 } in one DB query.
  const stats = await Review.aggregate([
    { $match: { productId: product._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        // Group rating counts by star level
        dist5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        dist4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        dist3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        dist2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        dist1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
      },
    },
  ]);

  const ratingStats = stats[0]
    ? {
        averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
        totalReviews: stats[0].totalReviews,
        distribution: {
          5: stats[0].dist5,
          4: stats[0].dist4,
          3: stats[0].dist3,
          2: stats[0].dist2,
          1: stats[0].dist1,
        },
      }
    : { averageRating: 0, totalReviews: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

  return {
    reviews,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    stats: ratingStats,
  };
};

/**
 * Delete a review. Users can only delete their own.
 * Admins can delete any review (handled at the route level with RBAC).
 */
export const deleteReview = async (reviewId, userId, isAdmin = false) => {
  const filter = isAdmin ? { _id: reviewId } : { _id: reviewId, userId };
  const review = await Review.findOneAndDelete(filter);
  if (!review) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      isAdmin ? "Review not found" : "Review not found or not yours to delete"
    );
  }
  await syncProductRating(review.productId);
  return review;
};

/**
 * Get a user's own reviews — useful for a "My Reviews" profile section.
 */
export const getUserReviews = async (userId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ userId })
      .populate("productId", "name brand images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ userId }),
  ]);
  return { reviews, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};
