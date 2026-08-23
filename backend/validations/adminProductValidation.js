import { z } from "zod";

// Shared shape for a single size/stock pair — reused in both create and
// update, and in the standalone stock-update endpoint.
const variantSchema = z.object({
  size: z.string().trim().min(1).max(20),
  stock: z.number().int().min(0),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(120),
  brand: z.string().trim().min(1).max(60),
  description: z.string().trim().max(1000).optional().default(""),
  category: z.enum(["top", "bottom", "footwear", "accessory", "outerwear"]),
  price: z.number().positive(),
  currency: z.string().trim().max(6).optional().default("INR"),
  images: z.array(z.string().url()).optional().default([]),
  variants: z.array(variantSchema).min(1, "At least one size with stock is required"),
  seasonTags: z.array(z.enum(["summer", "winter", "fall", "spring"])).min(1),
  occasionTags: z
    .array(z.enum(["casual", "formal", "beach", "travel", "party", "work"]))
    .min(1),
  colorFamily: z.string().trim().min(1).max(40),
  formalityLevel: z.number().min(1).max(5).optional().default(3),
  // Who the product is targeted at — powers the "gender" search filter.
  gender: z.enum(["men", "women", "unisex"]).optional().default("unisex"),
  // Powers the "style" search filter and the AI outfit engine's style-
  // specific candidate retrieval (see ai/retrieval.js).
  styleTags: z
    .array(z.enum(["minimal", "casual", "luxury", "streetwear", "smart_casual", "old_money", "korean", "party"]))
    .optional()
    .default([]),
  externalUrl: z.string().url().optional().nullable(),
});

// Update allows any subset of fields to change — .partial() makes every
// field optional without duplicating the whole schema.
export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  variants: z.array(variantSchema).min(1),
});
