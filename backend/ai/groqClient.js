import Groq from "groq-sdk";
import { config } from "../config/env.js";

// One shared client instance for the whole app — creating a new one per
// request would be wasteful, and this keeps the API key handling in
// exactly one place.
export const groqClient = new Groq({ apiKey: config.GROQ_API_KEY });
