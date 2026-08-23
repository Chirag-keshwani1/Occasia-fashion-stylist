import express from "express";
import * as outfitController from "../controllers/outfitController.js";
import * as recommendationController from "../controllers/recommendationController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { outfitContextSchema, parseOutfitSchema } from "../validations/outfitValidation.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Deliberately NOT behind requireAuth — a visitor can generate and
// preview an outfit before creating an account. It only gets tied to a
// user when they explicitly save it (which DOES require login, below).
router.post("/generate", aiLimiter, validate(outfitContextSchema), outfitController.createOutfit);
router.post("/parse-and-generate", aiLimiter, validate(parseOutfitSchema), outfitController.parseAndGenerateOutfit);

router.post("/:id/save", requireAuth, outfitController.saveOutfit);
router.get("/saved", requireAuth, outfitController.getSavedOutfits);
router.delete("/:id", requireAuth, outfitController.deleteOutfit);

// Outfit detail recommendation — find alternatives for each item in the outfit
// so the user can swap products they don't like while keeping the style.
router.get("/:id/alternatives", recommendationController.getOutfitItemAlternatives);

export default router;
