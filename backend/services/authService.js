import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenUtils.js";

// Creates a new user account. Password is hashed here — the raw password
// is never stored anywhere, not even briefly.
export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "An account with this email already exists");
  }

  // 12 salt rounds is the standard trade-off — strong enough to resist
  // brute force, fast enough not to slow down registration noticeably.
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  return issueTokens(user);
};

// Checks credentials and logs the user in.
export const loginUser = async ({ email, password }) => {
  // passwordHash is select:false by default, so we explicitly ask for it
  // here — this is the ONE place in the app that needs it.
  const user = await User.findOne({ email }).select("+passwordHash");

  // Same error message whether the email doesn't exist or the password is
  // wrong — this stops an attacker from using the login form to figure out
  // which emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid email or password");
  }

  return issueTokens(user);
};

// Syncs a user authenticated via Supabase.
// Handles account collision: if a user is found by email who already has
// authProvider: "local", it will NOT overwrite their authProvider or touch
// their passwordHash. It simply issues them tokens and logs them in.
export const supabaseSync = async ({ email, name }) => {
  let user = await User.findOne({ email });

  if (!user) {
    // Brand new user via Supabase
    user = await User.create({
      email,
      name: name || "User", // Fallback if name is missing from token
      authProvider: "supabase",
    });
  }
  // If user exists, we do NOT change their authProvider or passwordHash.
  // We just issue tokens and log them in as that existing account.

  return issueTokens(user);
};

// Shared by register + login: creates both tokens, stores a hash of the
// refresh token on the user (never the raw token), returns everything the
// controller needs to send back.
const issueTokens = async (user) => {
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  // We store a HASH of the refresh token, not the token itself. If the
  // database were ever leaked, an attacker still couldn't use these
  // hashes to log in as anyone — same principle as password hashing.
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save();

  return { user: user.toSafeObject(), accessToken, refreshToken };
};

// Takes the refresh token from the cookie, checks it's valid and matches
// what's stored for that user, and issues a brand new access token.
export const refreshAccessToken = async (token) => {
  if (!token) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "No refresh token provided");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Session no longer valid");
  }

  // Confirms this exact token was the one we issued — not just any
  // validly-signed token for this user (protects against a leaked-but-
  // since-rotated token still working).
  const isValid = await bcrypt.compare(token, user.refreshTokenHash);
  if (!isValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Session no longer valid");
  }

  return signAccessToken(user._id, user.role);
};

// Invalidates the stored refresh token so it can never be used again,
// even if someone still has the old cookie.
export const logoutUser = async (token) => {
  if (!token) return;
  try {
    const decoded = verifyRefreshToken(token);
    await User.findByIdAndUpdate(decoded.id, { refreshTokenHash: null });
  } catch {
    // Token already invalid/expired — nothing to clean up, not an error.
  }
};
