import Product from "../models/Product.js";
import Wishlist from "../models/Wishlist.js";
import Order from "../models/Order.js";
import RecentlyViewed from "../models/RecentlyViewed.js";
import { getRecentlyViewed } from "./recentlyViewedService.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Tag-based recommendation engine — no ML required.
 *
 * Strategy: gather signals from what the user has interacted with
 * (viewed, wishlisted, bought), extract the common season/occasion/color
 * tags from those products, then find other products with the most
 * overlapping tags. Pure MongoDB, zero cost, zero infra.
 *
 * This is the pattern used by most small-to-mid fashion platforms before
 * they invest in collaborative filtering or embedding-based similarity.
 * In interviews, you can describe it as "content-based filtering" — which
 * is accurate.
 */
export const getPersonalizedRecommendations = async (userId, limit = 12) => {
  // Gather the user's recently viewed products
  const recentItems = await getRecentlyViewed(userId, 10);
  const recentProductIds = recentItems.map((i) => i.product._id);

  // Also pull wishlist and order products for a richer signal
  const [wishlistDocs, orders] = await Promise.all([
    Wishlist.find({ userId }).select("productId"),
    Order.find({ userId }).select("items.productId"),
  ]);

  const wishlistIds = wishlistDocs.map((w) => w.productId);
  const orderedIds = orders.flatMap((o) => o.items.map((i) => i.productId));

  // All interaction product IDs combined
  const allInteractedIds = [...new Set([
    ...recentProductIds.map((id) => id.toString()),
    ...wishlistIds.map((id) => id.toString()),
    ...orderedIds.map((id) => id.toString()),
  ])];

  if (allInteractedIds.length === 0) {
    // No signal yet — fall back to trending products (most recently added)
    return getTrendingProducts(limit);
  }

  // Fetch the interacted products to extract their tags
  const interactedProducts = await Product.find({
    _id: { $in: allInteractedIds },
    isActive: true,
  }).select("seasonTags occasionTags colorFamily category");

  // Build a weighted frequency map: tags from recently-viewed products
  // count more than tags from older orders, since recency matters most
  const tagScores = {
    seasons: {},
    occasions: {},
    colors: {},
    categories: {},
  };

  const applyTags = (product, weight = 1) => {
    product.seasonTags?.forEach((t) => {
      tagScores.seasons[t] = (tagScores.seasons[t] || 0) + weight;
    });
    product.occasionTags?.forEach((t) => {
      tagScores.occasions[t] = (tagScores.occasions[t] || 0) + weight;
    });
    if (product.colorFamily) {
      tagScores.colors[product.colorFamily] = (tagScores.colors[product.colorFamily] || 0) + weight;
    }
    if (product.category) {
      tagScores.categories[product.category] = (tagScores.categories[product.category] || 0) + weight;
    }
  };

  // Apply weights: wishlist = 2x, recent views = 1.5x, orders = 1x
  interactedProducts.forEach((p) => {
    const isWishlisted = wishlistIds.some((id) => id.toString() === p._id.toString());
    const isOrdered = orderedIds.some((id) => id.toString() === p._id.toString());
    const weight = isWishlisted ? 2 : isOrdered ? 1 : 1.5;
    applyTags(p, weight);
  });

  // Extract the top tags as our recommendation "preferences"
  const topSeasons = getTopKeys(tagScores.seasons, 2);
  const topOccasions = getTopKeys(tagScores.occasions, 2);
  const topColors = getTopKeys(tagScores.colors, 3);

  // Build a filter that finds products sharing at least one top tag,
  // excluding everything the user has already interacted with
  const recommendationFilter = {
    isActive: true,
    _id: { $nin: allInteractedIds }, // exclude already-seen products
    $or: [
      ...(topSeasons.length ? [{ seasonTags: { $in: topSeasons } }] : []),
      ...(topOccasions.length ? [{ occasionTags: { $in: topOccasions } }] : []),
      ...(topColors.length ? [{ colorFamily: { $in: topColors } }] : []),
    ],
  };

  const products = await Product.find(recommendationFilter)
    .limit(limit * 2) // fetch more than needed so we can score and trim
    .select("name brand price images category colorFamily seasonTags occasionTags")
    .lean(); // lean() skips Mongoose virtuals (totalStock) which would crash without variants selected

  // Score each result by how many of the user's top tags it matches
  const scored = products.map((p) => {
    let score = 0;
    p.seasonTags?.forEach((t) => { if (topSeasons.includes(t)) score += tagScores.seasons[t] || 0; });
    p.occasionTags?.forEach((t) => { if (topOccasions.includes(t)) score += tagScores.occasions[t] || 0; });
    if (topColors.includes(p.colorFamily)) score += tagScores.colors[p.colorFamily] || 0;
    return { product: p, score };
  });

  // Sort by score descending, return the top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.product);
};

/**
 * Similar products: finds products that share the most tags with
 * a given product. Powers the "You might also like" section on a
 * product detail page.
 */
export const getSimilarProducts = async (productId, limit = 8) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  const similar = await Product.find({
    isActive: true,
    _id: { $ne: productId }, // exclude the product itself
    $or: [
      { seasonTags: { $in: product.seasonTags } },
      { occasionTags: { $in: product.occasionTags } },
      { colorFamily: product.colorFamily },
      { category: product.category },
    ],
  })
    .limit(limit * 2)
    .select("name brand price images category colorFamily seasonTags occasionTags")
    .lean(); // lean() = plain JS objects, no virtuals, faster reads

  // Score by overlap — more overlapping tags = more similar
  const scored = similar.map((p) => {
    let score = 0;
    if (p.category === product.category) score += 3; // same category is a strong signal
    if (p.colorFamily === product.colorFamily) score += 2;
    product.seasonTags?.forEach((t) => { if (p.seasonTags?.includes(t)) score += 1; });
    product.occasionTags?.forEach((t) => { if (p.occasionTags?.includes(t)) score += 1; });
    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.product);
};

/**
 * Trending products — used as a fallback for new users with no history.
 * "Trending" is defined as recently added + active. In a more mature
 * system this would use view/order counts, but those aren't tracked yet.
 */
export const getTrendingProducts = async (limit = 12) => {
  return Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("name brand price images category colorFamily seasonTags occasionTags")
    .lean(); // lean() = skip totalStock virtual (requires variants field)
};

// Helper: get the N keys with the highest values from a score map
const getTopKeys = (scoreMap, n) =>
  Object.entries(scoreMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([key]) => key);

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT DETAIL PAGE RECOMMENDATIONS
// All pure MongoDB — no AI cost. These power the "You might also like"
// sections when a user opens a single product's detail page.
// ─────────────────────────────────────────────────────────────────────────────

// Category complement map: defines which categories pair well together.
// E.g., if you're looking at a "top", we suggest "bottom" and "footwear".
const COMPLEMENT_MAP = {
  top: ["bottom", "footwear", "accessory", "outerwear"],
  bottom: ["top", "footwear", "accessory"],
  footwear: ["top", "bottom"],
  accessory: ["top", "bottom", "outerwear"],
  outerwear: ["top", "bottom", "footwear"],
};

/**
 * "Complete the Look" — find products from complementary categories
 * that share at least one season/occasion tag with the anchor product.
 * Powers the "Complete Your Outfit" section on product pages.
 */
export const getCompleteTheLook = async (productId, limit = 8) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  const complementCategories = COMPLEMENT_MAP[product.category] || [];
  if (complementCategories.length === 0) return [];

  const items = await Product.find({
    isActive: true,
    _id: { $ne: productId },
    category: { $in: complementCategories },
    $or: [
      { seasonTags: { $in: product.seasonTags } },
      { occasionTags: { $in: product.occasionTags } },
    ],
  })
    .limit(limit * 2)
    .select("name brand price images category colorFamily seasonTags occasionTags")
    .lean();

  // Score: matching season tags + occasion tags + color coordination
  const scored = items.map((p) => {
    let score = 0;
    product.seasonTags?.forEach((t) => { if (p.seasonTags?.includes(t)) score += 2; });
    product.occasionTags?.forEach((t) => { if (p.occasionTags?.includes(t)) score += 2; });
    if (p.colorFamily === product.colorFamily) score += 1; // same color family
    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.product);
};

/**
 * "Frequently Bought Together" — co-occurrence mining from the Orders
 * collection. Finds products that appear together with the given product
 * in the most orders. Pure aggregation — no ML required.
 */
export const getFrequentlyBoughtTogether = async (productId, limit = 6) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  // Find all orders that contain this product
  const co = await Order.aggregate([
    { $match: { "items.productId": product._id } },
    { $unwind: "$items" },
    // Exclude the anchor product itself from co-occurrence results
    { $match: { "items.productId": { $ne: product._id } } },
    { $group: { _id: "$items.productId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit * 2 },
  ]);

  if (co.length === 0) {
    // Fallback to similar products if no co-occurrence data exists
    return getSimilarProducts(productId, limit);
  }

  const ids = co.map((c) => c._id);
  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .select("name brand price images category colorFamily")
    .lean();

  // Preserve co-occurrence order (most frequently bought first)
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  return ids.map((id) => productMap.get(id.toString())).filter(Boolean).slice(0, limit);
};

/**
 * "More From This Brand" — other active products from the same brand.
 */
export const getMoreFromBrand = async (productId, limit = 8) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  return Product.find({
    isActive: true,
    brand: product.brand,
    _id: { $ne: productId },
  })
    .limit(limit)
    .select("name brand price images category colorFamily")
    .lean();
};

/**
 * Budget alternatives — same category, same season/occasion, lower price.
 * Premium alternatives — same category, same season/occasion, higher price.
 * Controlled by the `type` param: "budget" | "premium".
 */
export const getPriceAlternatives = async (productId, type = "budget", limit = 6) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");

  const priceFilter = type === "budget"
    ? { $lt: product.price }
    : { $gt: product.price };

  const sortOrder = type === "budget" ? { price: -1 } : { price: 1 };

  return Product.find({
    isActive: true,
    category: product.category,
    price: priceFilter,
    _id: { $ne: productId },
    $or: [
      { seasonTags: { $in: product.seasonTags } },
      { occasionTags: { $in: product.occasionTags } },
    ],
  })
    .sort(sortOrder)
    .limit(limit)
    .select("name brand price images category colorFamily")
    .lean();
};

/**
 * "Customers Also Viewed" — view co-occurrence from the RecentlyViewed
 * collection. Finds products that appear in the same viewing sessions as
 * the given product (other products the same users looked at).
 */
export const getCustomersAlsoViewed = async (productId, limit = 8) => {
  // Find users who viewed this product
  const viewerDocs = await RecentlyViewed.find({ "items.product": productId }).select("userId").lean();
  const userIds = viewerDocs.map((d) => d.userId);

  if (userIds.length === 0) {
    // No view data yet — fall back to similar products
    return getSimilarProducts(productId, limit);
  }

  // Find what else those same users looked at
  const coViewed = await RecentlyViewed.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $unwind: "$items" },
    { $match: { "items.product": { $ne: new (await import("mongoose")).default.Types.ObjectId(productId) } } },
    { $group: { _id: "$items.product", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit * 2 },
  ]);

  if (coViewed.length === 0) return getSimilarProducts(productId, limit);

  const ids = coViewed.map((c) => c._id);
  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .select("name brand price images category colorFamily")
    .lean();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  return ids.map((id) => productMap.get(id.toString())).filter(Boolean).slice(0, limit);
};

/**
 * Outfit detail page — for each product in a saved outfit, find
 * similar products from the same category.
 * Powers "Swap this item" or "Similar options" on the outfit detail view.
 */
export const getOutfitItemAlternatives = async (outfitId, limit = 4) => {
  const Outfit = (await import("../models/Outfit.js")).default;
  const outfit = await Outfit.findById(outfitId).populate("items.productId");
  if (!outfit) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Outfit not found");

  const results = await Promise.all(
    outfit.items.map(async (item) => {
      if (!item.productId) return null;
      const similar = await getSimilarProducts(item.productId._id, limit);
      return {
        category: item.category,
        currentProduct: item.productId,
        alternatives: similar,
      };
    })
  );

  return results.filter(Boolean);
};

