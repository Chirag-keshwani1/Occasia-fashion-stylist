import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    // Recorded because stock is tracked per size — without this, there'd
    // be no way to know which size variant's stock to restore on a
    // cancellation, or what was actually bought.
    size: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    // A real price SNAPSHOT, unlike Cart. Once an order is placed, the
    // price it was bought at must never change even if the product's
    // price changes later — this is what "priceAtOrder" protects.
    priceAtOrder: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    // Coupon snapshot — stored at checkout time, not a live reference.
    // This preserves the exact discount applied even if the coupon is
    // deleted or modified afterward (critical for audit trails).
    coupon: {
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
      type: { type: String, enum: ["flat", "percentage", null], default: null },
    },
    // Total after coupon discount (what was actually charged)
    total: { type: Number, required: true, min: 0 },
    // Shipping address snapshot — copied from user's address at checkout time
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
