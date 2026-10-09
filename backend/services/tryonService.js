import { Client, handle_file } from "@gradio/client";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

/**
 * Generate a Virtual Try-On image.
 * Uses Jimp to composite the garment onto the person image for a reliable fallback
 * since the Hugging Face GPU spaces are currently unstable.
 * 
 * @param {string} personImageUrl URL or local path of the person image
 * @param {string} garmentImageUrl URL of the garment image
 * @param {string} category 'top', 'bottom', or 'outerwear'
 * @returns {string} Resulting image URL
 */
export const generateTryOn = async (personImageUrl, garmentImageUrl, category) => {
  try {
    logger.info(`Starting Try-On generation for garment category: ${category}`);
    
    // Dynamic import to avoid Jimp issues in environments where it's not needed
    const { Jimp } = await import('jimp');
    
    logger.info("Loading images into Jimp...");
    const [person, garment] = await Promise.all([
      Jimp.read(personImageUrl),
      Jimp.read(garmentImageUrl)
    ]);

    // Make the garment 65% the width of the person
    const scale = 0.65;
    const targetWidth = person.bitmap.width * scale;
    
    // Resize garment proportionally
    garment.resize({ w: targetWidth });

    // Calculate position (centered horizontally, placed on chest for tops)
    const x = (person.bitmap.width - garment.bitmap.width) / 2;
    let y = 0;

    if (category === 'top' || category === 'outerwear') {
      y = person.bitmap.height * 0.2; // 20% from top (chest area)
    } else {
      y = person.bitmap.height * 0.5; // 50% from top (legs area)
    }

    // Composite garment over person
    person.composite(garment, x, y);

    // Get output buffer
    const buffer = await person.getBuffer('image/jpeg');
    
    logger.info("Composite created successfully, returning as Base64 data URL...");
    
    const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    return base64Image;
  } catch (error) {
    logger.error("Error generating try-on composite:", error);
    import("fs").then(fs => fs.appendFileSync("tryon-error.log", `\n[${new Date().toISOString()}] Original Jimp Error: ${error.stack}`));
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Try-on generation failed. " + error.message);
  }
};
