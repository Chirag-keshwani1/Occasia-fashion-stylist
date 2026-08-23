import express from "express";
import * as chatController from "../controllers/chatController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createSessionSchema, sendMessageSchema } from "../validations/chatValidation.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// All chat routes require login — conversations are personal
router.use(requireAuth);

// Session management
router.post("/sessions", validate(createSessionSchema), chatController.createSession);
router.get("/sessions", chatController.getMySessions);
router.get("/sessions/:sessionId", chatController.getSession);
router.patch("/sessions/:sessionId/close", chatController.closeSession);

// Sending a message applies the AI rate limiter — same reason as outfit generation
router.post(
  "/sessions/:sessionId/messages",
  aiLimiter,
  validate(sendMessageSchema),
  chatController.sendMessage
);

export default router;
