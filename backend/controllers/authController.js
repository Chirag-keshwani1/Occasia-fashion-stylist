import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { refreshCookieOptions } from "../utils/tokenUtils.js";
import * as authService from "../services/authService.js";
import { config } from "../config/env.js";
import axios from "axios";
import { createRemoteJWKSet, jwtVerify } from "jose";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  sendResponse(res, HTTP_STATUS.CREATED, { user, accessToken }, "Account created");
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  sendResponse(res, HTTP_STATUS.OK, { user, accessToken }, "Logged in");
});

export const refresh = asyncHandler(async (req, res) => {
  const accessToken = await authService.refreshAccessToken(req.cookies?.refreshToken);
  sendResponse(res, HTTP_STATUS.OK, { accessToken }, "Token refreshed");
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.cookies?.refreshToken);
  res.clearCookie("refreshToken", { path: "/api/auth" });
  sendResponse(res, HTTP_STATUS.OK, null, "Logged out");
});

// req.user is attached by the auth middleware — this route just proves
// the token worked and returns whoever it belongs to.
export const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, HTTP_STATUS.OK, { user: req.user }, "Current user");
});

export const supabaseSync = asyncHandler(async (req, res) => {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, "Supabase auth is not fully configured (missing URL or ANON_KEY)");
  }

  const { access_token } = req.body;
  if (!access_token) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No access token provided");
  }

  let payload;
  try {
    const response = await axios.get(`${config.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        apikey: config.SUPABASE_ANON_KEY,
      },
    });
    
    payload = response.data;
  } catch (error) {
    import("fs").then(fs => fs.appendFileSync("jwt-error.log", `\n[${new Date().toISOString()}] ${error.message} - ${error.stack}`));
    console.error("Supabase API Error:", error?.response?.data || error.message);
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid or expired Supabase token");
  }

  if (!payload.email) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Supabase token does not contain an email");
  }

  const { user, accessToken, refreshToken } = await authService.supabaseSync({
    email: payload.email,
    name: payload.user_metadata?.name || payload.user_metadata?.full_name || "User",
  });

  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  sendResponse(res, HTTP_STATUS.OK, { user, accessToken }, "Supabase sync successful");
});
