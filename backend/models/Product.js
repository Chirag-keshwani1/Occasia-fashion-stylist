import mongoose from "mongoose";

const sizeVariantSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // --- BASIC ---
    name: { type: String, required: true, trim: true, maxlength: 200 },
    brand: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", trim: true },
    gender: { type: String, enum: ["men", "women", "unisex", "kids"], default: "unisex" },
    category: { type: String, required: true, lowercase: true, trim: true },
    subcategory: { type: String, lowercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    images: [{ type: String }],
    externalUrl: { type: String, default: null },
    sku: { type: String, trim: true },
    availability: { type: String, default: "in_stock" },

    // --- FASHION ATTRIBUTES ---
    color: { type: String, trim: true },
    colorFamily: { type: String, trim: true, lowercase: true },
    fit: { type: String, trim: true, lowercase: true },
    pattern: { type: [String], default: [] },
    material: { type: String, trim: true, lowercase: true },
    neckline: { type: String, trim: true, lowercase: true },
    sleeveType: { type: String, trim: true, lowercase: true },
    length: { type: String, trim: true, lowercase: true },
    silhouette: { type: String, trim: true, lowercase: true },

    // --- STYLE INTELLIGENCE ---
    styleTags: { type: [String], default: [] },
    occasionTags: { type: [String], default: [] },
    seasonTags: { type: [String], default: [] },
    weatherTags: { type: [String], default: [] },
    formalityLevel: { type: Number, min: 1, max: 5 },

    // --- OUTFIT INTELLIGENCE ---
    outfitRole: { type: String, trim: true },
    compatibleCategories: { type: [String], default: [] },
    compatibleStyles: { type: [String], default: [] },
    compatibleOccasions: { type: [String], default: [] },
    compatibleSeasons: { type: [String], default: [] },
    colorMatchingTags: { type: [String], default: [] },

    // --- STOCK (SAFE & OPTIONAL) ---
    variants: {
      type: [sizeVariantSchema],
      default: [],
    },

    // --- SYSTEM FLAGS ---
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

// Compound indexes for the AI retrieval queries
productSchema.index({ seasonTags: 1, category: 1 });
productSchema.index({ occasionTags: 1, category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ styleTags: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ isActive: 1, createdAt: -1 });

// Full-text search index
productSchema.index(
  { name: "text", brand: "text", description: "text" },
  { weights: { name: 10, brand: 5, description: 1 }, name: "product_text_index" }
);

// Completely safe totalStock virtual computation
productSchema.virtual("totalStock").get(function () {
  if (!this.variants || !Array.isArray(this.variants)) return 0;
  return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
});
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
