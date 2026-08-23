import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as chatService from "../services/chatService.js";

// POST /api/chat/sessions
export const createSession = asyncHandler(async (req, res) => {
  const session = await chatService.createSession(req.user.id, req.body.context, req.body.outfitId);
  sendResponse(res, HTTP_STATUS.CREATED, { session }, "Chat session started");
});

// POST /api/chat/sessions/:sessionId/messages
export const sendMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendMessage(
    req.params.sessionId,
    req.user.id,
    req.body.message
  );
  sendResponse(res, HTTP_STATUS.OK, result, "Message sent");
});

// GET /api/chat/sessions
export const getMySessions = asyncHandler(async (req, res) => {
  const result = await chatService.getUserSessions(req.user.id, req.query);
  sendResponse(res, HTTP_STATUS.OK, result, "Chat sessions fetched");
});

// GET /api/chat/sessions/:sessionId
export const getSession = asyncHandler(async (req, res) => {
  const session = await chatService.getSessionMessages(req.params.sessionId, req.user.id);
  sendResponse(res, HTTP_STATUS.OK, { session }, "Chat session fetched");
});

// PATCH /api/chat/sessions/:sessionId/close
export const closeSession = asyncHandler(async (req, res) => {
  await chatService.closeSession(req.params.sessionId, req.user.id);
  sendResponse(res, HTTP_STATUS.OK, null, "Chat session closed");
});
