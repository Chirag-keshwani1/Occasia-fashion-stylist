import { z } from "zod";

// A loose but real check for a MongoDB ObjectId shape (24 hex characters)
// — catches an obviously malformed id before it even reaches the
// database, giving a clear 400 instead of a confusing CastError-based 500.
const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product id");

export const addToCartSchema = z.object({
  productId: objectIdString,
  size: z.string().trim().min(1).max(20),
  qty: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  qty: z.number().int().min(0), // 0 means "remove this item"
});
