import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { logger } from "../config/logger.js";

/**
 * Upload one or more images for a product.
 * Takes the buffers from multer, uploads each to Cloudinary in parallel,
 * and appends the resulting secure URLs to the product's images array.
 *
 * Parallel uploads: Promise.all fires all uploads at once instead of
 * sequentially — 5 images uploaded in ~1s instead of ~5s.
 */
export const uploadProductImages = async (productId, files) => {
  if (!files || files.length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No image files provided");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  // Upload all files to Cloudinary simultaneously
  const uploadResults = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, `occasia/products/${productId}`))
  );

  const newUrls = uploadResults.map((r) => r.url);
  logger.info(`Uploaded ${newUrls.length} images for product ${productId}`);

  // Append new URLs to the product's images array (don't replace)
  product.images.push(...newUrls);
  await product.save();

  return product.images;
};

/**
 * Delete a specific image from a product.
 * Accepts the image URL, derives the public_id from it,
 * removes it from Cloudinary, and removes the URL from the product.
 *
 * Why derive the public_id from the URL?
 * Storing the public_id separately for every image would require a
 * schema change. Deriving it from the URL is reliable because Cloudinary
 * URLs have a consistent format: everything after `/upload/v{version}/`
 * and before the file extension is the public_id.
 */
export const deleteProductImage = async (productId, imageUrl) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  if (!product.images.includes(imageUrl)) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Image not found on this product");
  }

  // Extract public_id from the Cloudinary URL
  // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder/publicId}.{ext}
  const publicIdMatch = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  if (publicIdMatch) {
    await deleteFromCloudinary(publicIdMatch[1]);
    logger.info(`Deleted Cloudinary image: ${publicIdMatch[1]}`);
  }

  product.images = product.images.filter((url) => url !== imageUrl);
  await product.save();

  return product.images;
};
