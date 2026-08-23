import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";

// Global baseline limit applied to every API route via app.js.
// This is a catch-all that prevents any single IP from overwhelming the
// server, even on routes that don't have a purpose-specific limiter.
// Thresholds are tunable via .env without touching code.
export const apiLimiter = rateLimit({
  windowMs: config.API_RATE_LIMIT_WINDOW_MS,
  limit: config.API_RATE_LIMIT_MAX,
  message: { success: false, message: "Too many requests — please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limits each IP to 20 attempts per 15 minutes on login/register. This
// doesn't stop a determined attacker completely, but it makes brute-forcing
// passwords or spamming fake account creation slow enough to not be worth it.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { success: false, message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit specifically for AI endpoints — each request costs a
// real call to the Groq API, so this protects the free-tier quota from
// being burned by accidental loops or deliberate abuse, separately from
// the general auth rate limit.
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  message: { success: false, message: "Too many AI requests — please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Even tighter limit for Virtual Try-On because it uses a shared HF GPU,
// takes 30-60s per request, and is easy to abuse.
export const tryonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 3, // Max 3 try-ons per 15 minutes per IP
  message: { success: false, message: "You've reached the try-on limit for now — try again in a few minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

