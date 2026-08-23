import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

// Access token: short-lived, sent in the Authorization header on every
// request, used to actually authenticate API calls.
export const signAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY,
  });

// Refresh token: long-lived, only used to get a new access token when the
// old one expires. Kept in an httpOnly cookie so frontend JavaScript can
// never read it — that's what protects it from theft via XSS.
export const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRY,
  });

export const verifyAccessToken = (token) => jwt.verify(token, config.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, config.JWT_REFRESH_SECRET);

export const refreshCookieOptions = {
  httpOnly: true, // JS can't read this cookie — blocks XSS token theft
  secure: config.NODE_ENV === "production", // HTTPS-only in production
  sameSite: "strict", // browser won't send this cookie on cross-site requests
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT_REFRESH_EXPIRY
  path: "/api/auth", // only sent to auth routes, not every request
};