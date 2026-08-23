import express from "express";
import * as recentlyViewedController from "../controllers/recentlyViewedController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// All recently-viewed routes require login — this data is personal
router.use(requireAuth);

router.get("/", recentlyViewedController.getRecentlyViewed);
router.delete("/", recentlyViewedController.clearRecentlyViewed);

export default router;
