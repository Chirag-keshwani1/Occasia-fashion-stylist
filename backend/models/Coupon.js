import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: [/^[A-Z0-9_-]+$/, "Coupon code can only contain letters, numbers, hyphens and underscores"],
    },
    // "flat" = fixed rupee discount, "percentage" = percent off
    type: { type: String, enum: ["flat", "percentage"], required: true },
    value: {
      type: Number,
      required: true,
      min: [1, "Discount value must be at least 1"],
      // percentage coupons are capped at 100
      validate: {
        validator: function (v) {
          return this.type !== "percentage" || v <= 100;
        },
        message: "Percentage discount cannot exceed 100",
      },
    },
    // Minimum cart total required to apply this coupon
    minCartValue: { type: Number, default: 0, min: 0 },
    // Maximum discount amount (only meaningful for percentage coupons)
    maxDiscount: { type: Number, default: null },
    // How many times this coupon can be used total across all users
    usageLimit: { type: Number, default: null, min: 1 },
    // How many times it's been used so far (incremented atomically at checkout)
    timesUsed: { type: Number, default: 0, min: 0 },
    // How many times a single user can use this coupon
    perUserLimit: { type: Number, default: 1, min: 1 },
    // Optional: restrict to specific users
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Optional: only apply to specific product categories
    applicableCategories: [{ type: String, enum: ["top", "bottom", "footwear", "accessory", "outerwear"] }],
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true, maxlength: 200, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// isActive + expiresAt composite index for efficient "find all valid coupons" queries.
// Note: code already has a unique index from { unique: true } on the field definition above.
couponSchema.index({ isActive: 1, expiresAt: 1 });

export default mongoose.model("Coupon", couponSchema);
