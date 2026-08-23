import mongoose from "mongoose";

const outfitSchema = new mongoose.Schema(
  {
    // Nullable on purpose — a visitor can generate/preview an outfit
    // before logging in. It only gets attached to an account when they
    // explicitly save it.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // All context fields are optional now — Task 1 made every Product
    // Search / AI Outfit filter optional ("Any"/empty/null/undefined all
    // mean "no filter"), so this subdocument can no longer require
    // season/occasion or it would reject perfectly valid generate requests.
    context: {
      season: { type: String, enum: ["summer", "winter", "fall", "spring"], default: null },
      occasion: {
        type: String,
        enum: ["casual", "formal", "beach", "travel", "party", "work"],
        default: null,
      },
      category: { type: String, enum: ["top", "bottom", "footwear", "accessory", "outerwear"], default: null },
      gender: { type: String, enum: ["men", "women", "unisex"], default: null },
      style: {
        type: String,
        enum: ["minimal", "casual", "luxury", "streetwear", "smart_casual", "old_money", "korean", "party"],
        default: null,
      },
      color: { type: String, default: "", trim: true },
      brand: { type: String, default: "", trim: true },
      formality: { type: Number, min: 1, max: 5, default: null },
      destination: { type: String, default: "", trim: true },
      budget: { type: Number, default: null },
      minPrice: { type: Number, default: null },
      maxPrice: { type: Number, default: null },
      stylePreference: { type: String, default: "", trim: true },
    },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        category: { type: String, required: true },
        _id: false,
      },
    ],

    aiRationale: { type: String, default: "", maxlength: 1000 },
    // The style archetype this outfit represents (Minimal, Luxury, Streetwear, etc.)
    styleName: { type: String, default: "Curated", maxlength: 60 },
    // One-sentence AI styling tip for wearing this outfit
    stylingTip: { type: String, default: "", maxlength: 400 },
    saved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

outfitSchema.index({ userId: 1, saved: 1 });

export default mongoose.model("Outfit", outfitSchema);
