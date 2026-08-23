import mongoose from "mongoose";

// Stores individual chat conversations between a user and the AI stylist.
// Each conversation has a context (season/occasion) and an array of messages
// (user messages and AI responses) so the AI can see the full conversation
// history and give contextually aware follow-up answers.
const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The styling context that anchors this conversation — the AI uses this
    // as the background for every response in the session.
    context: {
      season: { type: String, enum: ["summer", "winter", "fall", "spring"] },
      occasion: { type: String, enum: ["casual", "formal", "beach", "travel", "party", "work"] },
      budget: { type: Number, default: null },
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 2000,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        _id: false,
      },
    ],
    // Cap at 50 messages per session — beyond this the conversation should
    // be treated as a new session. This prevents context windows from growing
    // large enough to cause slow/expensive AI calls.
    messageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for fetching a user's active sessions quickly
chatSessionSchema.index({ userId: 1, isActive: 1, updatedAt: -1 });

export default mongoose.model("ChatSession", chatSessionSchema);
