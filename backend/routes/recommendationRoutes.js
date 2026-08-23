import express from "express";
import * as recommendationController from "../controllers/recommendationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public: anyone can see similar products and trending picks
router.get("/trending", recommendationController.getTrending);
router.get("/similar/:productId", recommendationController.getSimilar);

// Requires login: personalized recommendations depend on user history
router.get("/personalized", requireAuth, recommendationController.getPersonalized);

export default router;
