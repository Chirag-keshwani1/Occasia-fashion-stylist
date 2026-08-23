import { groqClient } from "./groqClient.js";
import { STYLE_ARCHETYPES, retrieveCandidatesForStyle, retrieveCandidates } from "./retrieval.js";
import { MULTI_OUTFIT_SYSTEM_PROMPT, buildMultiOutfitPrompt } from "./promptBuilder.js";
import { parseAiResponse, validateMultiOutfitResponse } from "./responseValidator.js";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import Product from "../models/Product.js";

/**
 * Generate 5–8 distinct outfit recommendations in a SINGLE Groq API call.
 *
 * How it works:
 *  1. For each style archetype (Minimal, Casual, Luxury etc.), retrieve
 *     style-appropriate product candidates filtered by formalityLevel range.
 *  2. Filter out archetypes where there aren't enough catalog products
 *     (needs at least 2 categories to form a valid outfit).
 *  3. Build a single prompt containing ALL styles' candidate pools.
 *  4. One Groq call returns a JSON array — one outfit object per style.
 *  5. Each outfit's selections are validated against its own candidate pool
 *     (the hallucination guardrail still applies per-style).
 *  6. Hydrate all validated product IDs in one batched MongoDB query.
 *
 * This is cheaper than N separate API calls and still gives diverse results
 * because each style has its own filtered candidate set.
 */
export const generateOutfits = async (context) => {
  // ── Step 1: Retrieve style-specific candidate pools in parallel ──
  const archetypeResults = await Promise.all(
    STYLE_ARCHETYPES.map(async (archetype) => {
      const byCategory = await retrieveCandidatesForStyle(context, archetype);
      return { styleName: archetype.name, byCategory };
    })
  );

  // ── Step 2: Filter out styles with too few products ──
  // An outfit needs at minimum 2 categories to be meaningful
  const viableStyles = archetypeResults.filter(
    ({ byCategory }) => Object.keys(byCategory).length >= 2
  );

  // If no style has enough products, fall back to the unfiltered pool
  // and create a single generic outfit (graceful degradation)
  if (viableStyles.length === 0) {
    const fallbackPool = await retrieveCandidates(context);
    if (Object.keys(fallbackPool).length === 0) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        "No products found matching those filters yet"
      );
    }
    // Return a single generic outfit using the original engine
    return generateSingleOutfit(context, fallbackPool);
  }

  // ── Step 3: Build the multi-outfit prompt ──
  const userPrompt = buildMultiOutfitPrompt(context, viableStyles);

  // ── Step 4: Single Groq API call for all outfits ──
  let completion;
  try {
    completion = await groqClient.chat.completions.create({
      model: config.GROQ_MODEL,
      messages: [
        { role: "system", content: MULTI_OUTFIT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8, // slightly higher for more diverse style interpretations
    });
  } catch (err) {
    logger.error(`Groq multi-outfit API call failed: ${err.message}`);
    throw new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, "AI styling service is temporarily unavailable");
  }

  const rawContent = completion.choices?.[0]?.message?.content;
  const parsed = parseAiResponse(rawContent);

  if (!parsed) {
    logger.warn(`AI returned non-JSON for multi-outfit: ${rawContent}`);
    throw new ApiError(HTTP_STATUS.BAD_GATEWAY, "AI response was invalid — please try again");
  }

  // ── Step 5: Validate each outfit against its style's candidate pool ──
  const validatedOutfits = validateMultiOutfitResponse(parsed, viableStyles);

  if (validatedOutfits.length === 0) {
    logger.warn(`All outfits failed validation. Raw: ${JSON.stringify(parsed).slice(0, 500)}`);
    throw new ApiError(HTTP_STATUS.BAD_GATEWAY, "AI could not form valid outfits — please try again");
  }

  // ── Step 6: Hydrate all product IDs in ONE batched query ──
  const allProductIds = [
    ...new Set(
      validatedOutfits.flatMap((o) => o.selections.map((s) => s.productId))
    ),
  ];
  const products = await Product.find({ _id: { $in: allProductIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  // Build the final response array — one object per style
  return validatedOutfits.map((outfit) => {
    const items = outfit.selections
      .map((s) => ({ category: s.category, product: productMap.get(s.productId) }))
      .filter((i) => i.product); // drop if product was deleted between retrieval and hydration

    return {
      styleName: outfit.styleName,
      items,
      aiRationale: outfit.rationale,
      stylingTip: outfit.stylingTip,
    };
  }).filter((o) => o.items.length > 0); // only return outfits that have at least 1 product
};

/**
 * Fallback: generate a single outfit when no style has enough products.
 * Preserves backward-compatible behavior for sparse catalogs.
 */
const generateSingleOutfit = async (context, byCategory) => {
  const { SYSTEM_PROMPT, buildUserPrompt } = await import("./promptBuilder.js");
  const { validateSelections } = await import("./responseValidator.js");

  let completion;
  try {
    completion = await groqClient.chat.completions.create({
      model: config.GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(context, byCategory) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
  } catch (err) {
    logger.error(`Groq fallback outfit API call failed: ${err.message}`);
    throw new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, "AI styling service is temporarily unavailable");
  }

  const rawContent = completion.choices?.[0]?.message?.content;
  const parsed = parseAiResponse(rawContent);
  if (!parsed) throw new ApiError(HTTP_STATUS.BAD_GATEWAY, "AI response was invalid — please try again");

  const validSelections = validateSelections(parsed.selections, byCategory);
  if (validSelections.length === 0) throw new ApiError(HTTP_STATUS.BAD_GATEWAY, "AI could not form a valid outfit — please try again");

  const productIds = validSelections.map((s) => s.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = validSelections
    .map((s) => ({ category: s.category, product: productMap.get(s.productId) }))
    .filter((i) => i.product);

  return [{
    styleName: "Curated",
    items,
    aiRationale: typeof parsed.rationale === "string" ? parsed.rationale.slice(0, 500) : "",
    stylingTip: "",
  }];
};

/**
 * Extract structured context (JSON matching outfitContextSchema) from natural language text.
 * Returns the parsed JSON object.
 */
export const extractContextFromText = async (text) => {
  const prompt = `
You are a context extractor for a fashion app. Your job is to extract the following optional attributes from the user's text and output them as JSON.
If an attribute is not explicitly mentioned or clearly implied, return null for it. Do NOT invent values.
Attributes to extract and their allowed values (or types):
- season: "summer" | "winter" | "fall" | "spring"
- occasion: "casual" | "formal" | "beach" | "travel" | "party" | "work"
- destination: string (e.g. "Goa", "Paris", "Mountains")
- budget: number (extract the maximum price or budget mentioned)
- stylePreference: string (any specific style vibe mentioned, e.g. "minimalist", "y2k")

Return ONLY valid JSON.
`;

  let completion;
  try {
    completion = await groqClient.chat.completions.create({
      model: config.GROQ_MODEL,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
  } catch (err) {
    logger.error(`Groq context extraction failed: ${err.message}`);
    throw new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, "AI extraction service is temporarily unavailable");
  }

  const rawContent = completion.choices?.[0]?.message?.content;
  let parsed = null;
  try {
    parsed = JSON.parse(rawContent);
  } catch (e) {
    logger.warn(`AI returned invalid JSON for extraction: ${rawContent}`);
    throw new ApiError(HTTP_STATUS.BAD_GATEWAY, "Failed to parse AI response into context");
  }

  return parsed;
};

