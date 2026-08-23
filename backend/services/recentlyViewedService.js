import RecentlyViewed from "../models/RecentlyViewed.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

const MAX_RECENT_ITEMS = 20;

/**
 * Record a product view for a logged-in user.
 * Called automatically when a user hits GET /api/products/:id
 * (the product controller calls this in the background).
 *
 * Logic:
 *  - If the product was already viewed, move it to the front (update viewedAt)
 *  - If it's new, add it to the front
 *  - If the array exceeds MAX_RECENT_ITEMS, slice off the oldest entries
 *
 * We use findOneAndUpdate with upsert:true so a single DB call handles
 * both the "user has no recently viewed doc yet" and "user already has one"
 * cases without a separate find-then-create.
 */
export const recordView = async (userId, productId) => {
  // First, remove the product if it already exists (to avoid duplicates
  // and move it to the front instead)
  await RecentlyViewed.updateOne(
    { userId },
    { $pull: { items: { productId } } },
    { upsert: true }
  );

  // Push to the front of the array with the current timestamp
  await RecentlyViewed.updateOne(
    { userId },
    {
      $push: {
        items: {
          $each: [{ productId, viewedAt: new Date() }],
          $position: 0, // prepend, not append
          $slice: MAX_RECENT_ITEMS, // keep only the latest N
        },
      },
    },
    { upsert: true }
  );
};

/**
 * Get the user's recently viewed products, with full product details.
 * Inactive (soft-deleted) products are filtered out so they don't
 * show up as ghost entries.
 */
export const getRecentlyViewed = async (userId, limit = 10) => {
  const doc = await RecentlyViewed.findOne({ userId }).populate({
    path: "items.productId",
    match: { isActive: true }, // silently skip soft-deleted products
    select: "name brand price images category colorFamily seasonTags occasionTags",
  });

  if (!doc) return [];

  // Filter out null entries (products that were soft-deleted and didn't
  // match the populate filter) and apply the limit
  return doc.items
    .filter((item) => item.productId !== null)
    .slice(0, limit)
    .map((item) => ({
      product: item.productId,
      viewedAt: item.viewedAt,
    }));
};

/**
 * Clear a user's entire recently viewed history.
 * Useful for a "clear history" button in the profile settings.
 */
export const clearRecentlyViewed = async (userId) => {
  await RecentlyViewed.findOneAndUpdate({ userId }, { items: [] });
};
