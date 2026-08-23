import express from "express";
import { createTryOn, getMyTryOnResults } from "../controllers/tryonController.js";
import { requireAuth } from "../middleware/auth.js";
import { tryonLimiter } from "../middleware/rateLimiter.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// router.use(requireAuth);

router.post("/generate", tryonLimiter, upload.single("personImage"), createTryOn);
router.get("/my-results", getMyTryOnResults);

export default router;
