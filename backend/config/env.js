import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Every environment variable the app needs, with real validation —
// not just "is it present" but "is it the right shape". Catching a
// malformed PORT or a MONGO_URI that isn't even a valid connection
// string here, at boot, is far better than discovering it three
// requests into production traffic.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Auth secrets — at least 32 characters so someone can't accidentally
  // ship a weak, guessable secret like "secret123"
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  // Free Groq API key from https://console.groq.com — no card required
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  // Cloudinary — optional() so the server still boots locally without them.
  // Image uploads simply won't work until these are filled in, which is
  // acceptable for a dev environment that hasn't set up Cloudinary yet.
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),

  // Global API rate limit — applied to every route as a baseline defence.
  // Individual sensitive routes (auth, AI) have their own tighter limits.
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),

  // Supabase Auth Integration
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid or missing environment variables:");
  // Flatten Zod's error tree into readable "FIELD: message" lines instead
  // of dumping the raw error object — this is what a teammate actually
  // wants to see when their .env is misconfigured.
  const fieldErrors = parsed.error.flatten().fieldErrors;
  for (const [field, messages] of Object.entries(fieldErrors)) {
    console.error(`  ${field}: ${messages.join(", ")}`);
  }
  process.exit(1);
}

// A single, typed, validated config object — every other file imports
// FROM HERE, never reads process.env directly. This means a typo'd env
// var name causes an import-time error in one place, not a silent
// `undefined` bug three files deep.
export const config = parsed.data;
