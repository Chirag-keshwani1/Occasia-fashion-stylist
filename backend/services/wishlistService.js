import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const addToWishlist = async (userId, productId) => {
  // Confirm the product is real before saving a reference to it — avoids
  // wishlisting a product id that doesn't exist or was mistyped.
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  try {
    const entry = await Wishlist.create({ userId, productId });
    return entry;
  } catch (err) {
    // Error code 11000 = MongoDB's duplicate key error, thrown by the
    // unique index when this exact (userId, productId) pair already
    // exists. We turn it into a friendly, expected error instead of a
    // scary 500 — this is normal user behavior (double-tapping "save"),
    // not a bug.
    if (err.code === 11000) {
      throw new ApiError(HTTP_STATUS.CONFLICT, "Product is already in your wishlist");
    }
    throw err;
  }
};

export const removeFromWishlist = async (userId, productId) => {
  const result = await Wishlist.findOneAndDelete({ userId, productId });
  if (!result) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "This product isn't in your wishlist");
  }
};

export const getWishlist = async (userId) => {
  // populate() replaces the bare productId with the full product
  // document. The match option means a deactivated product (isActive:
  // false) populates as null instead of showing a removed product — an
  // admin deactivating a product shouldn't leave broken cards in
  // someone's wishlist.
  const items = await Wishlist.find({ userId })
    .populate({ path: "productId", match: { isActive: true } })
    .sort({ createdAt: -1 });

  return items
    .filter((item) => item.productId) // drops entries where the product is gone/deactivated
    .map((item) => ({
      wishlistId: item._id,
      product: item.productId,
      addedAt: item.createdAt,
    }));
};
