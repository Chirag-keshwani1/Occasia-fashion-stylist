import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import * as productService from "../services/productService.js";

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user.id);
  sendResponse(res, HTTP_STATUS.CREATED, { product }, "Product created");
});

export const listProductsAdmin = asyncHandler(async (req, res) => {
  const result = await productService.getProductsForAdmin(req.query);
  sendResponse(res, HTTP_STATUS.OK, result, "Products fetched");
});

export const getProductAdmin = asyncHandler(async (req, res) => {
  const product = await productService.getProductByIdForAdmin(req.params.id);
  sendResponse(res, HTTP_STATUS.OK, { product }, "Product fetched");
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  sendResponse(res, HTTP_STATUS.OK, { product }, "Product updated");
});

export const deactivateProduct = asyncHandler(async (req, res) => {
  const product = await productService.deactivateProduct(req.params.id);
  sendResponse(res, HTTP_STATUS.OK, { product }, "Product deactivated");
});

export const activateProduct = asyncHandler(async (req, res) => {
  const product = await productService.activateProduct(req.params.id);
  sendResponse(res, HTTP_STATUS.OK, { product }, "Product activated");
});

export const updateStock = asyncHandler(async (req, res) => {
  const product = await productService.updateStock(req.params.id, req.body.variants);
  sendResponse(res, HTTP_STATUS.OK, { product }, "Stock updated");
});
