import express from "express";
import * as cartController from "../controllers/cartController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { addToCartSchema, updateCartItemSchema } from "../validations/cartValidation.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", cartController.getCart);
router.post("/", validate(addToCartSchema), cartController.addItem);
router.patch("/:productId/:size", validate(updateCartItemSchema), cartController.updateItemQty);
router.delete("/:productId/:size", cartController.removeItem);

export default router;
