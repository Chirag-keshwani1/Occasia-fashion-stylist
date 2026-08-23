import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(20).toUpperCase(),
  type: z.enum(["flat", "percentage"]),
  value: z.number().positive(),
  minCartValue: z.number().min(0).optional().default(0),
  maxDiscount: z.number().positive().nullable().optional().default(null),
  usageLimit: z.number().int().positive().nullable().optional().default(null),
  perUserLimit: z.number().int().positive().optional().default(1),
  allowedUsers: z.array(z.string()).optional().default([]),
  applicableCategories: z
    .array(z.enum(["top", "bottom", "footwear", "accessory", "outerwear"]))
    .optional()
    .default([]),
  expiresAt: z.coerce.date().nullable().optional().default(null),
  description: z.string().trim().max(200).optional().default(""),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1).max(20),
  cartTotal: z.number().positive(),
});
