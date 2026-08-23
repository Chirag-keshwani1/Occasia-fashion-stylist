import express from "express";
import * as authController from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, supabaseSyncSchema } from "../validations/authValidation.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       201:
 *         description: Account created. Returns user object + access token. Sets httpOnly refresh cookie.
 *       409:
 *         description: Email already registered
 */
router.post("/register", authLimiter, validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Login successful. Returns access token + user. Sets httpOnly refresh cookie.
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/supabase-sync:
 *   post:
 *     tags: [Auth]
 *     summary: Sync Supabase user session and issue JWT tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               access_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sync successful. Returns access token + user. Sets httpOnly refresh cookie.
 *       400:
 *         description: Invalid payload or missing access token
 *       401:
 *         description: Invalid Supabase token
 *       503:
 *         description: Supabase auth is not configured
 */
router.post("/supabase-sync", authLimiter, validate(supabaseSyncSchema), authController.supabaseSync);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Get a new access token using the refresh cookie
 *     security: []
 *     responses:
 *       200:
 *         description: Returns a fresh access token
 *       401:
 *         description: Refresh token missing or invalid
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Invalidate the current refresh token and clear the cookie
 *     security: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the current user's profile
 *       401:
 *         description: Not authenticated
 */
router.get("/me", requireAuth, authController.getMe);

export default router;

