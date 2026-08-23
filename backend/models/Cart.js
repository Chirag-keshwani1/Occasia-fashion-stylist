import mongoose from "mongoose";

// No price stored here on purpose. Storing a price snapshot on the cart
// would let it go stale (or be tampered with) — the cart only remembers
// WHAT and HOW MANY; the actual price is always looked up fresh from
// Product when the cart is displayed or checked out.
const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    size: { type: String, required: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    // unique: one cart per user — we always find-or-create rather than
    // ever allowing a second cart document to exist for the same person.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
