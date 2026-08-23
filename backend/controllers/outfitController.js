import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "../utils/ApiError.js";
import { generateOutfits, extractContextFromText } from "../ai/outfitEngine.js";
import Outfit from "../models/Outfit.js";
import { outfitContextSchema } from "../validations/outfitValidation.js";

/**
 * POST /api/outfits/generate
 *
 * Generates 5–8 unique outfit recommendations (one per style archetype)
 * in a single Groq API call. Each outfit is persisted immediately with
 * its own outfitId so the user can save any individual one later.
 * Guests can generate without logging in; saved is always initially false.
 */
export const createOutfit = asyncHandler(async (req, res) => {
  const outfitResults = await generateOutfits(req.body);

  // Persist each outfit as a separate document so each gets a real _id
  // that the frontend can reference for save/delete operations.
  // We use insertMany for efficiency rather than N separate creates.
  const outfitDocs = await Outfit.insertMany(
    outfitResults.map((result) => ({
      userId: req.user?.id || null,
      context: req.body,
      items: result.items.map((i) => ({ productId: i.product._id, category: i.category })),
      aiRationale: result.aiRationale,
      styleName: result.styleName,
      stylingTip: result.stylingTip,
      saved: false,
    }))
  );

  // Build the response: merge the DB ids with the hydrated product data
  const outfits = outfitResults.map((result, index) => ({
    outfitId: outfitDocs[index]._id,
    styleName: result.styleName,
    context: req.body,
    items: result.items,
    aiRationale: result.aiRationale,
    stylingTip: result.stylingTip,
  }));

  sendResponse(
    res,
    HTTP_STATUS.CREATED,
    { outfits, count: outfits.length },
    `${outfits.length} outfit recommendations generated`
  );
});

export const saveOutfit = asyncHandler(async (req, res) => {
  const outfit = await Outfit.findById(req.params.id);
  if (!outfit) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Outfit not found");
  }

  outfit.userId = req.user.id;
  outfit.saved = true;
  await outfit.save();

  sendResponse(res, HTTP_STATUS.OK, { outfit }, "Outfit saved");
});

export const getSavedOutfits = asyncHandler(async (req, res) => {
  const outfits = await Outfit.find({ userId: req.user.id, saved: true })
    .populate("items.productId")
    .sort({ createdAt: -1 });
  sendResponse(res, HTTP_STATUS.OK, { outfits }, "Saved outfits fetched");
});

export const deleteOutfit = asyncHandler(async (req, res) => {
  const outfit = await Outfit.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!outfit) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Outfit not found");
  }
  sendResponse(res, HTTP_STATUS.OK, null, "Outfit removed");
});

export const parseAndGenerateOutfit = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const rawExtractedContext = await extractContextFromText(text);

  const parsed = outfitContextSchema.safeParse(rawExtractedContext);
  
  if (!parsed.success) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "I couldn't quite understand that — try mentioning an occasion, destination, or budget");
  }

  const interpretedContext = parsed.data;
  console.log("Interpreted context:", interpretedContext);

  // Check if it has essentially no usable fields
  if (!interpretedContext.season && !interpretedContext.occasion && !interpretedContext.destination && !interpretedContext.budget && !interpretedContext.stylePreference) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "I couldn't quite understand that — try mentioning an occasion, destination, or budget");
  }

  // Reuse the existing generation logic but with the newly interpreted context
  // Replace req.body with interpretedContext for the generation process
  const originalBody = req.body;
  req.body = interpretedContext;
  
  const outfitResults = await generateOutfits(interpretedContext);

  const outfitDocs = await Outfit.insertMany(
    outfitResults.map((result) => ({
      userId: req.user?.id || null,
      context: interpretedContext,
      items: result.items.map((i) => ({ productId: i.product._id, category: i.category })),
      aiRationale: result.aiRationale,
      styleName: result.styleName,
      stylingTip: result.stylingTip,
      saved: false,
    }))
  );

  const outfits = outfitResults.map((result, index) => ({
    outfitId: outfitDocs[index]._id,
    styleName: result.styleName,
    context: interpretedContext,
    items: result.items,
    aiRationale: result.aiRationale,
    stylingTip: result.stylingTip,
  }));

  // Restore req.body just in case
  req.body = originalBody;

  sendResponse(
    res,
    HTTP_STATUS.CREATED,
    { interpretedContext, outfits, count: outfits.length },
    `${outfits.length} outfit recommendations generated from text`
  );
});
