import express from "express";
import * as wishlistController from "../controllers/wishlistController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Wishlist is inherently personal — every route needs a logged-in user,
// applied once for the whole file.
router.use(requireAuth);

router.get("/", wishlistController.getWishlist);
router.post("/:productId", wishlistController.addToWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);

export default router;
