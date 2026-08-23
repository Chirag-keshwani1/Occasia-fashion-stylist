import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "../utils/ApiError.js";
import Product from "../models/Product.js";
import TryOnResult from "../models/TryOnResult.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { generateTryOn } from "../services/tryonService.js";
import { logger } from "../config/logger.js";
import axios from "axios";

/**
 * Generate Virtual Try-On
 * POST /api/tryon/generate
 * Form-data: personImage (file), productId (text)
 */
export const createTryOn = async (req, res, next) => {
  let personImagePublicId = null;
  let personImageUrl = null;
  
  try {
    const { productId } = req.body;
    req.user = req.user || { _id: "60b5f1f4e1f1a50a1c1d8a1c" }; // valid object id
    if (!productId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "productId is required");
    }

    if (!req.file) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Person image file is required");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
    }

    // Only allow tops, bottoms, outerwear
    if (!["top", "bottom", "outerwear"].includes(product.category)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Virtual Try-On is only supported for tops, bottoms, and outerwear"
      );
    }

    if (!product.images || product.images.length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Product has no images to try on");
    }

    // Bypass Cloudinary: write person image to a local temp file for Gradio
    const fs = await import("fs");
    const path = await import("path");
    const os = await import("os");
    
    const tempPersonImagePath = path.join(os.tmpdir(), `person_${Date.now()}.jpg`);
    fs.writeFileSync(tempPersonImagePath, req.file.buffer);
    
    personImageUrl = tempPersonImagePath;
    logger.info(`Saved person image locally to: ${tempPersonImagePath}`);

    // 2. Call Try-On Service
    const garmentImageUrl = product.images[0];
    const generatedUrl = await generateTryOn(personImageUrl, garmentImageUrl, product.category);
    
    // Bypass Cloudinary: use the direct HuggingFace generated URL
    const finalResultUrl = generatedUrl;

    // 3. Save result to database
    const tryOnResult = await TryOnResult.create({
      user: req.user._id,
      product: product._id,
      resultImageUrl: finalResultUrl,
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: tryOnResult,
    });
  } catch (error) {
    import("fs").then(fs => fs.appendFileSync("tryon-error.log", `\n[${new Date().toISOString()}] ${error.message} - ${error.stack}`));
    next(error);
  } finally {
    // GUARANTEED CLEANUP: Always delete the local person image for privacy
    if (personImageUrl) {
      try {
        const fs = await import("fs");
        if (fs.existsSync(personImageUrl)) {
          fs.unlinkSync(personImageUrl);
        }
        logger.info(`Privacy Cleanup: Deleted local person image: ${personImageUrl}`);
      } catch (cleanupError) {
        logger.error(`Privacy Cleanup Failed: Could not delete ${personImageUrl}`, cleanupError);
      }
    }
  }
};

/**
 * Get User's Try-On History
 * GET /api/tryon/my-results
 */
export const getMyTryOnResults = async (req, res, next) => {
  try {
    const results = await TryOnResult.find({ user: req.user._id })
      .populate("product", "name price images category")
      .sort("-createdAt");

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
