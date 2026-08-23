import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    body: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    // Tracks whether this reviewer actually bought the product.
    // We verify this in the service before allowing a review to be created,
    // but storing it here means the frontend can show a "Verified Purchase"
    // badge without making an extra query to the Orders collection.
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One review per user per product — MongoDB itself enforces this.
// Two simultaneous "submit review" requests can't race each other and
// both succeed because the DB rejects the second at the index level.
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Efficient listing: we'll frequently fetch all reviews for a product,
// ordered newest first.
reviewSchema.index({ productId: 1, createdAt: -1 });

export default mongoose.model("Review", reviewSchema);
