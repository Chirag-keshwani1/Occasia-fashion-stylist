import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import productRoutes from "./productRoutes.js";
import adminRoutes from "./adminRoutes.js";
import wishlistRoutes from "./wishlistRoutes.js";
import orderRoutes from "./orderRoutes.js";
import outfitRoutes from "./outfitRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import recentlyViewedRoutes from "./recentlyViewedRoutes.js";
import chatRoutes from "./chatRoutes.js";
import recommendationRoutes from "./recommendationRoutes.js";
import tryonRoutes from "./tryonRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/admin", adminRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/outfits", outfitRoutes);
router.use("/reviews", reviewRoutes);
router.use("/recently-viewed", recentlyViewedRoutes);
router.use("/chat", chatRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/tryon", tryonRoutes);

export default router;


