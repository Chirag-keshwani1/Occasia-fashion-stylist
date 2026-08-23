import { z } from "zod";

// z.object() describes exactly what a valid request body looks like.
// Anything that doesn't match gets rejected before it ever touches the
// database or business logic — this is what "never trust client input" means
// in practice.
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const supabaseSyncSchema = z.object({
  access_token: z.string().min(1, "Supabase access token is required"),
});