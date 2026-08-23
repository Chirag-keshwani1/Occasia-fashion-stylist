import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Sort options map: maps the query param value to a Mongoose sort object.
// "rating" sorts by the denormalized averageRating field (kept in sync by
// reviewService on every review create/delete), so this is a plain indexed
// sort — no extra query or in-request aggregation needed.
const SORT_MAP = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
  rating: { averageRating: -1, reviewCount: -1, createdAt: -1 },
};

// Builds the shared MongoDB filter object from a validated query. All
// filters are optional — by the time we get here, productValidation.js has
// already normalized "Any"/""/null/undefined to `undefined` for every
// field, so any key that's still present is a real filter the caller wants
// applied. Every field is added conditionally: a key that resolves to
// `undefined` in the filter object would otherwise be sent to MongoDB as an
// explicit `{ field: undefined }` match, which is not the same as "ignore
// this field" for every driver/version, so we only ever add keys we mean.
const buildProductFilter = (query, { includeInactive = false } = {}) => {
  const {
    season,
    occasion,
    category,
    gender,
    style,
    color,
    brand,
    formality,
    destination,
    minPrice,
    maxPrice,
    search,
  } = query;

  const filter = includeInactive ? {} : { isActive: true };

  if (season) filter.seasonTags = season;
  if (occasion) filter.occasionTags = occasion;
  if (category) filter.category = category;
  if (gender) filter.gender = gender;
  if (style) filter.styleTags = style;
  if (color) filter.colorFamily = { $regex: `^${escapeRegex(color)}$`, $options: "i" };
  if (brand) filter.brand = { $regex: escapeRegex(brand), $options: "i" };
  if (formality) filter.formalityLevel = formality;

  // "destination" isn't a real product field (no geo/travel data model
  // exists on Product) — it signals the shopper is planning a trip, so we
  // treat it as a soft boost toward travel-appropriate products instead of
  // silently ignoring it. If the caller also passed an explicit `occasion`,
  // that wins — we don't override an explicit choice.
  if (destination && !occasion) filter.occasionTags = "travel";

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  if (search) filter.$text = { $search: search };

  return filter;
};

// Escapes regex special characters so brand/color filters can't be used to
// inject an arbitrary regex pattern.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Builds and runs the filtered, paginated product query. Only active
// (not soft-deleted) products are ever shown to regular users.
export const getProducts = async (query) => {
  const { sort, page, limit, search } = query;

  const filter = buildProductFilter(query);

  // Full-text search via the compound text index (name 10x, brand 5x, description 1x).
  // When a text query is present, we also project the textScore so results can
  // be sorted by relevance. Falls back to the normal sort when no search term.
  let sortObj = SORT_MAP[sort] || SORT_MAP.newest;
  if (search && sort === "newest") {
    // Relevance sort takes priority over date when user is actively searching
    sortObj = { score: { $meta: "textScore" }, createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  // Run the count and the actual fetch at the same time instead of one
  // after another — cuts the request's total wait time roughly in half.
  const [products, total] = await Promise.all([
    Product.find(filter, search ? { score: { $meta: "textScore" } } : {})
      .skip(skip)
      .limit(limit)
      .sort(sortObj),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

// New Arrivals: the most recently added active products, paginated.
// Reuses getProducts (and therefore the same filter/pagination/response
// shape as the main Product Search API) instead of duplicating query
// logic — it's just a forced sort=newest with no other filters applied.
export const getNewArrivals = async (query) => {
  return getProducts({ ...query, sort: "newest" });
};

export const getProductById = async (id) => {
  const product = await Product.findOne({ _id: id, isActive: true });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }
  return product;
};

// --- Admin operations below ---
// Kept in the same service file as the public read functions (not a
// separate adminProductService) because it's the same underlying data —
// splitting by "who's allowed to call it" rather than "what data it
// touches" would scatter logic for one model across two files.

export const createProduct = async (data, adminId) => {
  const product = await Product.create({ ...data, createdBy: adminId });
  return product;
};

// Admins can see soft-deleted products too (isActive: false) — a regular
// user should never see a removed product, but an admin managing the
// catalog needs to, e.g. to restore it.
export const getProductByIdForAdmin = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }
  return product;
};

export const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, {
    new: true, // return the updated document, not the old one
    runValidators: true, // re-run schema validation on the update
  });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }
  return product;
};

// Soft delete — flips isActive to false instead of removing the
// document. Once Orders exist, past orders still need this product's
// data to display order history correctly, which a hard delete would break.
export const deactivateProduct = async (id) => {
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }
  return product;
};

export const activateProduct = async (id) => {
  const product = await Product.findByIdAndUpdate(id, { isActive: true }, { new: true });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }
  return product;
};

// Replaces the full variants array (size/stock pairs) in one call —
// simpler than a "patch one size" endpoint, and matches how an admin
// panel would realistically submit a stock update (the whole size table
// at once, not one row at a time).
export const updateStock = async (id, variants) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { variants },
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }
  return product;
};

// Admin listing includes inactive products too, and supports the same
// filters as the public list so an admin panel table can reuse them.
export const getProductsForAdmin = async (query) => {
  const { search, page, limit } = query;
  const filter = buildProductFilter(query, { includeInactive: true });

  // Admin listing intentionally keeps its original lightweight name-regex
  // search instead of the $text index — unchanged from prior behavior.
  if (search) {
    delete filter.$text;
    filter.name = { $regex: search, $options: "i" };
  }

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};
