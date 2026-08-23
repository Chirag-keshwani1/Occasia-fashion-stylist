import mongoose from "mongoose";

// Backs the checkout idempotency strategy (see services/orderService.js).
// A client sends an "Idempotency-Key" header with each checkout attempt;
// this collection records which keys have already been claimed by which
// user, and what the outcome was. Repeating the same key — a double click,
// or a network retry after a timeout — returns the original result instead
// of creating a second order.
const idempotencyKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true, default: "checkout" },
    // "processing" is written first (before the real work starts) so a
    // concurrent duplicate request sees it immediately instead of racing
    // past an empty collection. It's moved to "completed" only after the
    // order actually exists.
    status: { type: String, enum: ["processing", "completed"], default: "processing" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

// The same key is only meaningful per-user, per-endpoint — this unique
// index is what makes "claim a key" atomic: two simultaneous requests with
// the same key can't both succeed at inserting, so only one proceeds to
// actually run checkout.
idempotencyKeySchema.index({ userId: 1, endpoint: 1, key: 1 }, { unique: true });

// TTL — stale keys (including ones stuck in "processing" from a crashed
// request) are cleaned up automatically after 24h so a client can eventually
// retry with the same key, and so this collection never grows unbounded.
idempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export default mongoose.model("IdempotencyKey", idempotencyKeySchema);
