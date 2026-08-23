import { z } from "zod";

export const createSessionSchema = z.object({
  context: z
    .object({
      season: z.enum(["summer", "winter", "fall", "spring"]).optional(),
      occasion: z
        .enum(["casual", "formal", "beach", "travel", "party", "work"])
        .optional(),
      budget: z.number().positive().optional().nullable(),
    })
    .default({}),
  outfitId: z.string().optional(),
});

export const sendMessageSchema = z.object({
  // Length-capped to prevent token flooding and prompt injection attempts.
  // 500 characters is enough for any reasonable fashion question.
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long (max 500 characters)"),
});
