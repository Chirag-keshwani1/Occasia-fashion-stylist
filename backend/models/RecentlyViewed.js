import mongoose from "mongoose";

// Tracks which products a logged-in user has viewed, and when.
// This powers the "Recently Viewed" section on the UI and feeds into
// the personalized recommendation engine.
//
// Design: one document per user, with a capped array of viewed items.
// We cap it at 20 entries — older views drop off automatically through
// the service logic. This keeps the document small and the query fast
// without ever needing a separate cleanup job.
const recentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one document per user
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("RecentlyViewed", recentlyViewedSchema);
