import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/env.js";

// Cloudinary is configured once at module load time. Any other file
// that imports from here gets the same already-configured instance.
// This is the only file that touches the Cloudinary credentials —
// all upload/delete calls go through the functions below.
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer (from multer memory storage) to Cloudinary.
 * Returns the secure URL and the public_id (needed for deletions later).
 *
 * Why streams instead of temp files?
 *  - No disk writes on the server — never accumulates temp files
 *  - Works correctly on serverless/containerized deployments that
 *    don't have a writable /tmp
 *  - The buffer comes from multer's memoryStorage, so it's already in RAM
 */
export const uploadToCloudinary = (buffer, folder = "occasia/products") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 1200, height: 1200, crop: "limit" }, // cap the max dimension
          { quality: "auto:good" },                      // let Cloudinary choose optimal quality
          { fetch_format: "auto" },                      // serve WebP/AVIF automatically
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by its public_id.
 * Called when an admin removes an image from a product.
 */
export const deleteFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
