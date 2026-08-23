import express from "express";
import * as userController from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
  preferencesSchema,
} from "../validations/userValidation.js";

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the current user's full profile (includes addresses and preferences)
 *     responses:
 *       200:
 *         description: Full user profile
 *   patch:
 *     tags: [Users]
 *     summary: Update name or email
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Updated profile
 *       409:
 *         description: Email already in use
 */
router.get("/me", userController.getProfile);
router.patch("/me", validate(updateProfileSchema), userController.updateProfile);

/**
 * @swagger
 * /users/me/change-password:
 *   post:
 *     tags: [Users]
 *     summary: Change password (invalidates all sessions)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed, sessions invalidated
 *       401:
 *         description: Current password is incorrect
 */
router.post("/me/change-password", validate(changePasswordSchema), userController.changePassword);

/**
 * @swagger
 * /users/me/addresses:
 *   get:
 *     tags: [Users]
 *     summary: List all saved shipping addresses
 *   post:
 *     tags: [Users]
 *     summary: Add a new shipping address (max 5)
 */
router.get("/me/addresses", userController.getAddresses);
router.post("/me/addresses", validate(addressSchema), userController.addAddress);

/**
 * @swagger
 * /users/me/addresses/{addressId}:
 *   put:
 *     tags: [Users]
 *     summary: Update a shipping address
 *   delete:
 *     tags: [Users]
 *     summary: Delete a shipping address
 */
router.put("/me/addresses/:addressId", validate(addressSchema.partial()), userController.updateAddress);
router.delete("/me/addresses/:addressId", userController.deleteAddress);
router.patch("/me/addresses/:addressId/default", userController.setDefaultAddress);

/**
 * @swagger
 * /users/me/preferences:
 *   get:
 *     tags: [Users]
 *     summary: Get style preferences
 *   patch:
 *     tags: [Users]
 *     summary: Update style preferences (merge — only sent fields are updated)
 */
router.get("/me/preferences", userController.getPreferences);
router.patch("/me/preferences", validate(preferencesSchema), userController.updatePreferences);

/**
 * @swagger
 * /users/me/activity:
 *   get:
 *     tags: [Users]
 *     summary: Get combined activity history (orders, reviews, wishlist, recently viewed)
 */
router.get("/me/activity", userController.getActivityHistory);

export default router;
