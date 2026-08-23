import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional().default(""),
  body: z.string().trim().max(1000).optional().default(""),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});
