import { z } from "zod";

// --- Profile Update ---
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  email: z.string().email().toLowerCase().optional(),
});

// --- Change Password ---
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// --- Address ---
export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().default("Home"),
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional(),
  line1: z.string().trim().min(5).max(120),
  line2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().max(60).optional().default("India"),
  isDefault: z.boolean().optional().default(false),
});

// --- Preferences ---
export const preferencesSchema = z.object({
  favoriteStyles: z
    .array(z.enum(["minimal", "casual", "luxury", "streetwear", "smart_casual", "old_money", "korean", "party"]))
    .optional(),
  favoriteOccasions: z
    .array(z.enum(["casual", "formal", "beach", "travel", "party", "work"]))
    .optional(),
  favoriteColors: z.array(z.string().trim().max(30)).max(10).optional(),
  budgetMin: z.number().min(0).nullable().optional(),
  budgetMax: z.number().min(0).nullable().optional(),
  bodyType: z.enum(["slim", "athletic", "regular", "plus", "petite", "tall"]).nullable().optional(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]).nullable().optional(),
});
