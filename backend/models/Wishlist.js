import mongoose from "mongoose";

// One document per (user, product) pair, rather than one document per
// user with an array of product ids inside it. This means adding or
// removing a single wishlist item is a single small write, not "fetch
// the whole array, modify it, save the whole array back" — which matters
// once a user has hundreds of saved items.
const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

// A compound UNIQUE index — this is what actually stops a user from
// wishlisting the same product twice. It's enforced by MongoDB itself,
// not just application logic, so it holds even under concurrent requests
// (e.g. someone double-clicking "save" fast enough to fire two requests
// before the first one's response comes back).
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.model("Wishlist", wishlistSchema);
