import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as uploadService from "../services/uploadService.js";

// POST /api/admin/products/:id/images
// Accepts multipart/form-data with field name "images" (up to 5 files)
export const uploadImages = asyncHandler(async (req, res) => {
  const images = await uploadService.uploadProductImages(req.params.id, req.files);
  sendResponse(res, HTTP_STATUS.CREATED, { images }, "Images uploaded successfully");
});

// DELETE /api/admin/products/:id/images
// Body: { imageUrl: "https://res.cloudinary.com/..." }
export const deleteImage = asyncHandler(async (req, res) => {
  const images = await uploadService.deleteProductImage(req.params.id, req.body.imageUrl);
  sendResponse(res, HTTP_STATUS.OK, { images }, "Image deleted successfully");
});
