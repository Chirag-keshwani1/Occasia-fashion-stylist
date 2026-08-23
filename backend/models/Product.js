import mongoose from "mongoose";

// Each size is tracked separately — a shirt might be sold out in Medium
// but still available in Small. Size is just a plain string (not a fixed
// list) because sizing is different per category: clothes use S/M/L,
// shoes use numbers, accessories are often "One Size".
const sizeVariantSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    brand: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },

    category: {
      type: String,
      required: true,
      enum: ["top", "bottom", "footwear", "accessory", "outerwear"],
    },

    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    images: [{ type: String }],

    variants: {
      type: [sizeVariantSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Product must have at least one size with stock",
      },
    },

    // These tags are what the AI outfit engine searches by later — this
    // is the most important part of this schema for the whole project.
    seasonTags: {
      type: [{ type: String, enum: ["summer", "winter", "fall", "spring"] }],
      validate: { validator: (v) => v.length > 0, message: "At least one season tag is required" },
    },
    occasionTags: {
      type: [{ type: String, enum: ["casual", "formal", "beach", "travel", "party", "work"] }],
      validate: { validator: (v) => v.length > 0, message: "At least one occasion tag is required" },
    },
    colorFamily: { type: String, required: true, trim: true, maxlength: 40 },
    formalityLevel: { type: Number, min: 1, max: 5, default: 3 },

    // Who the product is targeted at. Powers the "gender" search filter —
    // defaults to "unisex" so existing products (created before this field
    // existed) still match sensibly instead of being excluded by default.
    gender: { type: String, enum: ["men", "women", "unisex"], default: "unisex" },

    // Style tags power the multi-outfit generator — each style archetype
    // (Minimal, Streetwear, Luxury, etc.) maps to a formalityLevel range
    // and a set of style tags, letting the AI retrieve appropriate candidates.
    // Also powers the "style" search filter.
    styleTags: {
      type: [String],
      default: [],
    },

    // Denormalized rating aggregates, kept in sync by reviewService
    // whenever a review is created or deleted. Denormalizing means product
    // search can sort by rating with a plain indexed field instead of
    // joining/aggregating the Review collection on every search request.
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },

    externalUrl: { type: String, default: null },

    // Soft-delete flag instead of actually deleting products. Once real
    // orders exist (Milestone 8), hard-deleting a product would break
    // order history — this way an admin can retire a product from the
    // live catalog while past orders still show what was bought.
    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

// Compound indexes for the AI retrieval queries (season+category, occasion+category)
productSchema.index({ seasonTags: 1, category: 1 });
productSchema.index({ occasionTags: 1, category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ styleTags: 1 });
// Supports ?sort=rating without a collection scan, and supports the
// "New Arrivals" query (isActive + createdAt) efficiently.
productSchema.index({ averageRating: -1 });
productSchema.index({ isActive: 1, createdAt: -1 });

// Full-text search index — powers ?search= with relevance ranking instead
// of slow regex scans. Weights make name matches rank higher than brand
// or description matches, which matches natural shopping search intent.
productSchema.index(
  { name: "text", brand: "text", description: "text" },
  { weights: { name: 10, brand: 5, description: 1 }, name: "product_text_index" }
);

// A computed value, not a stored one — adds up stock across all sizes.
// Being computed means it can never accidentally go out of sync with the
// real variants array.
productSchema.virtual("totalStock").get(function () {
  return this.variants.reduce((sum, v) => sum + v.stock, 0);
});
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
