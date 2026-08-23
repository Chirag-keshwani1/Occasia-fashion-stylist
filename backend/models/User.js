import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Sub-schema for a single shipping address
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40, default: "Home" }, // e.g. "Home", "Work"
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120, default: "" },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    state: { type: String, required: true, trim: true, maxlength: 60 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 60, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Sub-schema for the user's fashion style preferences.
// These power the AI outfit generator (pre-fill context) and personalised
// recommendations — the more a user fills in, the better the suggestions.
const preferencesSchema = new mongoose.Schema(
  {
    favoriteStyles: {
      type: [String],
      enum: ["minimal", "casual", "luxury", "streetwear", "smart_casual", "old_money", "korean", "party"],
      default: [],
    },
    favoriteOccasions: {
      type: [String],
      enum: ["casual", "formal", "beach", "travel", "party", "work"],
      default: [],
    },
    favoriteColors: { type: [String], default: [] },
    budgetMin: { type: Number, min: 0, default: null },
    budgetMax: { type: Number, min: 0, default: null },
    bodyType: {
      type: String,
      enum: ["slim", "athletic", "regular", "plus", "petite", "tall", null],
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non_binary", "prefer_not_to_say", null],
      default: null,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    // select: false means this field is hidden by default on every query.
    // A controller has to explicitly ask for it (.select("+passwordHash"))
    // to use it — so it can never leak into an API response by accident.
    passwordHash: { 
      type: String, 
      required: function() { return this.authProvider === 'local'; }, 
      select: false 
    },
    authProvider: { type: String, enum: ["local", "supabase"], default: "local" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshTokenHash: { type: String, default: null, select: false },

    // Shipping addresses — up to 5 per user, one marked as default.
    // Kept embedded (not a separate collection) because they're small,
    // always fetched with the user, and never queried independently.
    addresses: {
      type: [addressSchema],
      validate: {
        validator: (v) => v.length <= 5,
        message: "A user can have at most 5 saved addresses",
      },
      default: [],
    },

    // Style preferences — used to pre-fill outfit context and personalise recs.
    preferences: { type: preferencesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Compares a plain password (from a login form) against the stored hash.
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Strips out anything sensitive before a user object is sent in a response.
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  delete obj.__v;
  return obj;
};

export default mongoose.model("User", userSchema);