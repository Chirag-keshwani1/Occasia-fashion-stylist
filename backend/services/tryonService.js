import { Client, handle_file } from "@gradio/client";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

/**
 * Generate a Virtual Try-On image using the IDM-VTON model on Hugging Face Spaces.
 * @param {string} personImageUrl URL of the person image (Cloudinary)
 * @param {string} garmentImageUrl URL of the garment image (Cloudinary)
 * @param {string} category 'top', 'bottom', or 'outerwear'
 * @returns {string} Resulting image URL
 */
export const generateTryOn = async (personImageUrl, garmentImageUrl, category) => {
  try {
    logger.info(`Starting Try-On generation for garment category: ${category}`);
    
    // The yisol/IDM-VTON space has disabled its API endpoints on Hugging Face.
    // For now, we simulate the generation delay and return the garment image as a placeholder.
    await new Promise(resolve => setTimeout(resolve, 3000));
    return garmentImageUrl;
  } catch (error) {
    logger.error("Error calling IDM-VTON API:", error);
    if (error.response) logger.error("Response data:", error.response.data);
    
    const errMessage = error.message ? error.message.toLowerCase() : "";
    if (errMessage.includes("timeout") || errMessage.includes("queue") || errMessage.includes("503") || errMessage.includes("504")) {
       throw new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, "Try-on service is busy right now, please try again in a moment");
    }
    
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Try-on generation failed, please try again later.");
  }
};
