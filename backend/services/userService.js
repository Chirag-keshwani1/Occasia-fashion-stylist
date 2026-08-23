import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import Wishlist from "../models/Wishlist.js";
import { getRecentlyViewed } from "./recentlyViewedService.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// ============================================================
// PROFILE
// ============================================================

/**
 * Update the user's name or email.
 * Email change checks for collisions first.
 */
export const updateProfile = async (userId, data) => {
  const { name, email } = data;

  // If email is changing, make sure it isn't already taken
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: userId } });
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, "That email address is already in use");
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { ...(name && { name }), ...(email && { email }) },
    { new: true, runValidators: true }
  );

  if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
  return user.toSafeObject();
};

/**
 * Change password — verifies the current password first.
 * Never lets a user change to the same password they already have.
 */
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  // Need the hash to verify — it's select:false by default
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Current password is incorrect");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "New password must be different from the current one");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  // Invalidate all refresh tokens so any existing sessions are kicked out
  user.refreshTokenHash = null;
  await user.save();
};

// ============================================================
// ADDRESSES
// ============================================================

export const getAddresses = async (userId) => {
  const user = await User.findById(userId).select("addresses");
  if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
  return user.addresses;
};

/**
 * Add a new address. If isDefault is true, demote all others first.
 * If this is the user's first address, make it default automatically.
 */
export const addAddress = async (userId, addressData) => {
  const user = await User.findById(userId).select("addresses");
  if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");

  if (user.addresses.length >= 5) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Maximum 5 addresses allowed");
  }

  // Auto-default if it's the first address, or explicitly requested
  const shouldBeDefault = addressData.isDefault || user.addresses.length === 0;

  if (shouldBeDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }

  user.addresses.push({ ...addressData, isDefault: shouldBeDefault });
  await user.save();
  return user.addresses;
};

/**
 * Update an existing address by its subdocument _id.
 */
export const updateAddress = async (userId, addressId, addressData) => {
  const user = await User.findById(userId).select("addresses");
  if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");

  const address = user.addresses.id(addressId);
  if (!address) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Address not found");

  // If setting this one as default, unset all others
  if (addressData.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }

  Object.assign(address, addressData);
  await user.save();
  return user.addresses;
};

/**
 * Delete an address. If the deleted address was the default,
 * auto-promote the first remaining address.
 */
export const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId).select("addresses");
  if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");

  const address = user.addresses.id(addressId);
  if (!address) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Address not found");

  const wasDefault = address.isDefault;
  address.deleteOne();

  // Promote first remaining address if the deleted one was the default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return user.addresses;
};

/**
 * Set a specific address as the default.
 */
export const setDefaultAddress = async (userId, addressId) => {
  const user = await User.findById(userId).select("addresses");
  if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");

  const address = user.addresses.id(addressId);
  if (!address) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Address not found");

  user.addresses.forEach((a) => { a.isDefault = a._id.toString() === addressId; });
  await user.save();
  return user.addresses;
};

// ============================================================
// PREFERENCES
// ============================================================

export const getPreferences = async (userId) => {
  const user = await User.findById(userId).select("preferences");
  if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
  return user.preferences;
};

/**
 * Merge-update preferences — only fields provided get updated,
 * so a frontend can update just "bodyType" without clearing everything else.
 */
export const updatePreferences = async (userId, data) => {
  const user = await User.findById(userId).select("preferences");
  if (!user) throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");

  Object.assign(user.preferences, data);
  await user.save();
  return user.preferences;
};

// ============================================================
// ACTIVITY HISTORY
// ============================================================

/**
 * Returns a combined activity summary: recent orders, reviews, wishlist,
 * and recently viewed products. Useful for a "My Activity" dashboard page.
 */
export const getActivityHistory = async (userId) => {
  const [orders, reviews, wishlist, recentlyViewed] = await Promise.all([
    Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("items.productId", "name brand images price"),
    Review.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("productId", "name brand images price"),
    Wishlist.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate("productId", "name brand images price"),
    getRecentlyViewed(userId, 10),
  ]);

  return {
    recentOrders: orders,
    recentReviews: reviews,
    wishlistItems: wishlist,
    recentlyViewed,
  };
};
