import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as analyticsService from "../services/analyticsService.js";

export const getOverview = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getOverview();
  sendResponse(res, HTTP_STATUS.OK, stats, "Overview stats fetched");
});

export const getRevenueSeries = asyncHandler(async (req, res) => {
  const period = ["day", "week", "month"].includes(req.query.period) ? req.query.period : "day";
  const limit = parseInt(req.query.limit) || 30;
  const series = await analyticsService.getRevenueSeries(period, limit);
  sendResponse(res, HTTP_STATUS.OK, { series, period }, "Revenue series fetched");
});

export const getTopProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const products = await analyticsService.getTopProducts(limit);
  sendResponse(res, HTTP_STATUS.OK, { products }, "Top products fetched");
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  const limit = parseInt(req.query.limit) || 20;
  const products = await analyticsService.getLowStockProducts(threshold, limit);
  sendResponse(res, HTTP_STATUS.OK, { products, threshold }, "Low stock products fetched");
});

export const getUserList = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const result = await analyticsService.getUserList({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
  });
  sendResponse(res, HTTP_STATUS.OK, result, "Users fetched");
});
