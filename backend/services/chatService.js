import ChatSession from "../models/ChatSession.js";
import { chatWithStylist } from "../ai/chatEngine.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

import Outfit from "../models/Outfit.js";

/**
 * Create a new chat session, optionally with a styling context.
 * The context anchors every AI response in this session to the
 * specified season/occasion/budget without the user having to
 * repeat it in every message.
 */
export const createSession = async (userId, context = {}, outfitId = null) => {
  if (outfitId) {
    const outfit = await Outfit.findById(outfitId).populate("items.productId");
    if (!outfit) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Outfit not found");
    }
    
    // Allow guest outfits (userId is null) or the user's own outfits
    if (outfit.userId && outfit.userId.toString() !== userId.toString()) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, "You do not have permission to reference this outfit");
    }

    const itemNames = outfit.items
      .map(i => `${i.category}: ${i.productId ? i.productId.name : 'Unknown Product'}`)
      .join(", ");
    
    context.outfitSummary = `Style: ${outfit.styleName}. AI Rationale: ${outfit.aiRationale}. Items: [${itemNames}].`;
  }

  const session = await ChatSession.create({ userId, context, messages: [] });
  return session;
};

/**
 * Send a message in an existing session, get an AI response,
 * and persist both to the session's message history.
 */
export const sendMessage = async (sessionId, userId, userMessage) => {
  // Fetch the session and verify ownership
  const session = await ChatSession.findOne({ _id: sessionId, userId, isActive: true });
  if (!session) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Chat session not found");
  }

  // Get AI response
  const aiResponse = await chatWithStylist(session, userMessage);

  // Append both messages to the session history
  session.messages.push(
    { role: "user", content: userMessage, timestamp: new Date() },
    { role: "assistant", content: aiResponse, timestamp: new Date() }
  );
  session.messageCount += 2;

  // If we're past the cap, close the session so the next message
  // prompts the user to start a new one (checked in chatEngine.js)
  if (session.messageCount >= 50) {
    session.isActive = false;
  }

  await session.save();

  return {
    userMessage,
    aiResponse,
    messageCount: session.messageCount,
    sessionActive: session.isActive,
  };
};

/**
 * Get a user's chat sessions (most recent first), with a message preview.
 * We don't return the full message history here — that's fetched per-session.
 */
export const getUserSessions = async (userId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    ChatSession.find({ userId })
      .select("context messageCount isActive createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    ChatSession.countDocuments({ userId }),
  ]);
  return { sessions, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

/**
 * Get the full message history for a specific session.
 */
export const getSessionMessages = async (sessionId, userId) => {
  const session = await ChatSession.findOne({ _id: sessionId, userId });
  if (!session) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Chat session not found");
  }
  return session;
};

/**
 * Soft-close a session — marks it inactive so no more messages can be sent.
 * Does not delete the history, which is preserved for the user to read.
 */
export const closeSession = async (sessionId, userId) => {
  const session = await ChatSession.findOneAndUpdate(
    { _id: sessionId, userId },
    { isActive: false },
    { new: true }
  );
  if (!session) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Chat session not found");
  }
  return session;
};
