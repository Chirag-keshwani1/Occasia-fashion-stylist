import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as userService from "../services/userService.js";

// --- Profile ---

export const getProfile = asyncHandler(async (req, res) => {
  // req.user is set by requireAuth. We need the full document with addresses/prefs.
  const User = (await import("../models/User.js")).default;
  const user = await User.findById(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, { user: user.toSafeObject() }, "Profile fetched");
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  sendResponse(res, HTTP_STATUS.OK, { user }, "Profile updated");
});

export const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user.id, req.body);
  // Clear the refresh token cookie — all sessions are now invalid
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict", secure: true });
  sendResponse(res, HTTP_STATUS.OK, null, "Password changed. Please log in again.");
});

// --- Addresses ---

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await userService.getAddresses(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, { addresses }, "Addresses fetched");
});

export const addAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.addAddress(req.user.id, req.body);
  sendResponse(res, HTTP_STATUS.CREATED, { addresses }, "Address added");
});

export const updateAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.updateAddress(req.user.id, req.params.addressId, req.body);
  sendResponse(res, HTTP_STATUS.OK, { addresses }, "Address updated");
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.deleteAddress(req.user.id, req.params.addressId);
  sendResponse(res, HTTP_STATUS.OK, { addresses }, "Address deleted");
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.setDefaultAddress(req.user.id, req.params.addressId);
  sendResponse(res, HTTP_STATUS.OK, { addresses }, "Default address updated");
});

// --- Preferences ---

export const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await userService.getPreferences(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, { preferences }, "Preferences fetched");
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await userService.updatePreferences(req.user.id, req.body);
  sendResponse(res, HTTP_STATUS.OK, { preferences }, "Preferences updated");
});

// --- Activity ---

export const getActivityHistory = asyncHandler(async (req, res) => {
  const activity = await userService.getActivityHistory(req.user.id);
  sendResponse(res, HTTP_STATUS.OK, activity, "Activity history fetched");
});
