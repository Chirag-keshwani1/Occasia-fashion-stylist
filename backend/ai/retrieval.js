import Product from "../models/Product.js";

const CATEGORIES = ["top", "bottom", "footwear", "accessory", "outerwear"];
const CANDIDATES_PER_CATEGORY = 10;

// Style archetypes — each maps to a formalityLevel range and optional tag hints.
// These are used to retrieve separate candidate pools per style BEFORE the AI call,
// so the AI always has style-appropriate products to choose from.
export const STYLE_ARCHETYPES = [
  { name: "Minimal",      formalityMin: 2, formalityMax: 3 },
  { name: "Casual",       formalityMin: 1, formalityMax: 2 },
  { name: "Smart Casual", formalityMin: 3, formalityMax: 4 },
  { name: "Formal",       formalityMin: 4, formalityMax: 5 },
  { name: "Streetwear",   formalityMin: 1, formalityMax: 2 },
  { name: "Luxury",       formalityMin: 4, formalityMax: 5 },
  { name: "Old Money",    formalityMin: 3, formalityMax: 5 },
  { name: "Party Wear",   formalityMin: 2, formalityMax: 4 },
];

// Builds the shared MongoDB filter for candidate retrieval. Every field is
// optional — mirrors productService.buildProductFilter so Product Search
// and the AI outfit engine apply "no filter when not provided" consistently.
// Only isActive is always applied.
const buildCandidateFilter = ({ season, occasion, gender, style, color, brand, formality, destination, budget, minPrice, maxPrice }) => {
  const filter = { isActive: true };

  if (season) filter.seasonTags = season;
  if (occasion) filter.occasionTags = occasion;
  if (gender) filter.gender = gender;
  if (style) filter.styleTags = style;
  if (color) filter.colorFamily = { $regex: `^${escapeRegex(color)}$`, $options: "i" };
  if (brand) filter.brand = { $regex: escapeRegex(brand), $options: "i" };
  if (formality) filter.formalityLevel = formality;

  // Same soft-boost behavior as Product Search: a destination implies a
  // trip, so lean toward travel-tagged products when no explicit occasion
  // filter was given.
  if (destination && !occasion) filter.occasionTags = "travel";

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  } else if (budget) {
    // Backward-compatible: `budget` alone still means "max price per item".
    filter.price = { $lte: budget };
  }

  return filter;
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Retrieve candidates for a single style archetype.
 * Filters by whatever optional context fields were provided (season,
 * occasion, gender, color, brand, budget/price range, etc), AND the
 * archetype's formalityLevel range — ensuring the AI only picks from
 * style-appropriate products. If the caller also passed an explicit
 * `formality` filter, that takes precedence over the archetype's range.
 * If the caller passed a `category` filter, only that category is retrieved
 * (instead of all 5) so results stay scoped to what was asked for.
 */
export const retrieveCandidatesForStyle = async (context, archetype) => {
  const baseFilter = buildCandidateFilter(context);
  if (!context.formality) {
    baseFilter.formalityLevel = { $gte: archetype.formalityMin, $lte: archetype.formalityMax };
  }

  const categories = context.category ? [context.category] : CATEGORIES;
  const byCategory = {};

  for (const category of categories) {
    const items = await Product.find({ ...baseFilter, category })
      .limit(CANDIDATES_PER_CATEGORY)
      .select("_id name brand price colorFamily formalityLevel category styleTags")
      .lean();

    if (items.length > 0) {
      byCategory[category] = items;
    }
  }

  return byCategory;
};

/**
 * Fallback: retrieve all candidates without style (formalityLevel range)
 * filtering. Used when style-specific pools are too small.
 */
export const retrieveCandidates = async (context) => {
  const baseFilter = buildCandidateFilter(context);
  const categories = context.category ? [context.category] : CATEGORIES;
  const byCategory = {};

  for (const category of categories) {
    const items = await Product.find({ ...baseFilter, category })
      .limit(CANDIDATES_PER_CATEGORY)
      .select("_id name brand price colorFamily formalityLevel category styleTags")
      .lean();

    if (items.length > 0) {
      byCategory[category] = items;
    }
  }

  return byCategory;
};
