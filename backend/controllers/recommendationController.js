import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as recommendationService from "../services/recommendationService.js";

// ── User-level recommendations ──────────────────────────────────────────────

// GET /api/recommendations/personalized
export const getPersonalized = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  const products = await recommendationService.getPersonalizedRecommendations(req.user.id, limit);
  sendResponse(res, HTTP_STATUS.OK, { products }, "Personalized recommendations fetched");
});

// GET /api/recommendations/similar/:productId or /api/products/:id/similar
export const getSimilar = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const productId = req.params.productId || req.params.id;
  const products = await recommendationService.getSimilarProducts(productId, limit);
  sendResponse(res, HTTP_STATUS.OK, { products }, "Similar products fetched");
});

// GET /api/recommendations/trending
export const getTrending = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  const products = await recommendationService.getTrendingProducts(limit);
  sendResponse(res, HTTP_STATUS.OK, { products }, "Trending products fetched");
});

// ── Product detail page recommendations ────────────────────────────────────

// GET /api/products/:id/complete-the-look
export const getCompleteTheLook = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const products = await recommendationService.getCompleteTheLook(req.params.id, limit);
  sendResponse(res, HTTP_STATUS.OK, { products }, "Complete the look fetched");
});

// GET /api/products/:id/frequently-bought-together
export const getFrequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const products = await recommendationService.getFrequentlyBoughtTogether(req.params.id, limit);
  sendResponse(res, HTTP_STATUS.OK, { products }, "Frequently bought together fetched");
});

// GET /api/products/:id/more-from-brand
export const getMoreFromBrand = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const products = await recommendationService.getMoreFromBrand(req.params.id, limit);
  sendResponse(res, HTTP_STATUS.OK, { products }, "More from brand fetched");
});

// GET /api/products/:id/alternatives?type=budget|premium
export const getPriceAlternatives = asyncHandler(async (req, res) => {
  const type = req.query.type === "premium" ? "premium" : "budget";
  const limit = parseInt(req.query.limit) || 6;
  const products = await recommendationService.getPriceAlternatives(req.params.id, type, limit);
  sendResponse(res, HTTP_STATUS.OK, { products, type }, `${type} alternatives fetched`);
});

// GET /api/products/:id/customers-also-viewed
export const getCustomersAlsoViewed = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  const products = await recommendationService.getCustomersAlsoViewed(req.params.id, limit);
  sendResponse(res, HTTP_STATUS.OK, { products }, "Customers also viewed fetched");
});

// ── Outfit detail page recommendations ────────────────────────────────────

// GET /api/outfits/:id/alternatives
export const getOutfitItemAlternatives = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 4;
  const items = await recommendationService.getOutfitItemAlternatives(req.params.id, limit);
  sendResponse(res, HTTP_STATUS.OK, { items }, "Outfit item alternatives fetched");
});

