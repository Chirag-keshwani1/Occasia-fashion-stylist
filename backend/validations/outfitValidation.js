import { z } from "zod";
import { optionalFilter } from "./common.js";

// Every field here is a fixed enum or a bounded string/number — none of
// it is free-form text that gets passed straight to the AI unchecked.
// destination and stylePreference DO reach the prompt as text, but
// they're length-capped and the system prompt explicitly tells the model
// to treat them as data, not instructions (see ai/promptBuilder.js) —
// two layers of defense against prompt injection instead of one.
//
// All filters are optional (see optionalFilter in ./common.js): "Any",
// "", null, and undefined all mean "no filter" for both this endpoint and
// the Product Search API. When season/occasion/etc are omitted, the AI
// retrieval pipeline (ai/retrieval.js) simply doesn't constrain on them.
export const outfitContextSchema = z.object({
  season: optionalFilter(z.enum(["summer", "winter", "fall", "spring"])),
  occasion: optionalFilter(z.enum(["casual", "formal", "beach", "travel", "party", "work"])),
  category: optionalFilter(z.enum(["top", "bottom", "footwear", "accessory", "outerwear"])),
  gender: optionalFilter(z.enum(["men", "women", "unisex"])),
  style: optionalFilter(
    z.enum(["minimal", "casual", "luxury", "streetwear", "smart_casual", "old_money", "korean", "party"])
  ),
  color: optionalFilter(z.string().trim().max(40)),
  brand: optionalFilter(z.string().trim().max(60)),
  formality: optionalFilter(z.coerce.number().int().min(1).max(5)),
  destination: optionalFilter(z.string().trim().max(80)),
  // `budget` is kept for backward compatibility (treated as a max price per
  // item). minPrice/maxPrice give the same price-range control as Product
  // Search when a caller wants both ends of the range.
  budget: optionalFilter(z.coerce.number().positive()),
  minPrice: optionalFilter(z.coerce.number().min(0)),
  maxPrice: optionalFilter(z.coerce.number().min(0)),
  stylePreference: optionalFilter(z.string().trim().max(120)),
});

export const parseOutfitSchema = z.object({
  text: z.string().trim().min(1, "Please provide some text").max(300, "Text is too long (max 300 characters)"),
});
