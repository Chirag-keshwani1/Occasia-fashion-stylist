import mongoose from "mongoose";

const tryOnResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    resultImageUrl: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

tryOnResultSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("TryOnResult", tryOnResultSchema);
