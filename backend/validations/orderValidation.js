import { z } from "zod";

// Checkout takes no body — it just converts whatever is currently in the
// user's cart into an order. Keeping it argument-free (reading straight
// from the Cart collection) means the client can never "checkout" items
// that were never actually in the cart.
export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
});

export const orderQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
