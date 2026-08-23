import { z } from "zod";
import { optionalFilter } from "./common.js";

// Query params come in as strings even for numbers, so z.coerce converts
// them for us. Everything here is optional — a plain GET /products with
// no filters should still work and just return everything.
//
// Every filter is wrapped in optionalFilter() so "Any", "", null, and
// undefined are all treated as "no filter" — the frontend can send any
// combination of these query params without triggering a validation error.
export const productQuerySchema = z.object({
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
  // Not a real product field — "destination" signals a trip, so it's used
  // as a soft boost toward travel-appropriate products (see productService).
  destination: optionalFilter(z.string().trim().max(80)),
  minPrice: optionalFilter(z.coerce.number().min(0)),
  maxPrice: optionalFilter(z.coerce.number().min(0)),
  search: optionalFilter(z.string().trim().max(100)),
  // Sort options: price_asc, price_desc, newest (default), rating
  sort: z.enum(["price_asc", "price_desc", "newest", "rating"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});
