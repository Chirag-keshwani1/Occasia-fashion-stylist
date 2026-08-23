import express from "express";
import * as adminController from "../controllers/adminController.js";
import * as orderController from "../controllers/orderController.js";
import * as uploadController from "../controllers/uploadController.js";
import * as analyticsController from "../controllers/analyticsController.js";
import * as reviewController from "../controllers/reviewController.js";
import * as couponController from "../controllers/couponController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from "../validations/adminProductValidation.js";
import { productQuerySchema } from "../validations/productValidation.js";
import { updateOrderStatusSchema, orderQuerySchema } from "../validations/orderValidation.js";

const router = express.Router();

// Every route in this file requires the user to be logged in AND have
// the "admin" role — applied once here with router.use() instead of
// repeating requireAuth/requireRole on every single line below.
router.use(requireAuth, requireRole("admin"));

router.get("/products", validateQuery(productQuerySchema), adminController.listProductsAdmin);
router.get("/products/:id", adminController.getProductAdmin);
router.post("/products", validate(createProductSchema), adminController.createProduct);
router.put("/products/:id", validate(updateProductSchema), adminController.updateProduct);
router.patch("/products/:id/deactivate", adminController.deactivateProduct);
router.patch("/products/:id/activate", adminController.activateProduct);
router.patch("/products/:id/stock", validate(updateStockSchema), adminController.updateStock);

// Image management — multipart/form-data handled by multer.
// upload.array("images", 5) accepts up to 5 files per request under
// the field name "images". The files end up in req.files as Buffer objects.
router.post("/products/:id/images", upload.array("images", 5), uploadController.uploadImages);
router.delete("/products/:id/images", uploadController.deleteImage);

router.get("/orders", validateQuery(orderQuerySchema), orderController.getAllOrders);
// Setting status to "cancelled" here restores stock the same way the
// user-facing POST /orders/mine/:id/cancel does (see orderService.updateOrderStatus) —
// atomic, and safe to call more than once without double-restoring stock.
router.patch(
  "/orders/:id/status",
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

// ── Analytics Dashboard ──────────────────────────────────────────────────────
// All read-only aggregation queries — no writes happen here.
router.get("/analytics/overview", analyticsController.getOverview);
router.get("/analytics/revenue", analyticsController.getRevenueSeries);
router.get("/analytics/top-products", analyticsController.getTopProducts);
router.get("/analytics/low-stock", analyticsController.getLowStockProducts);

// ── User Management ──────────────────────────────────────────────────────────
router.get("/users", analyticsController.getUserList);

// ── Review Moderation ────────────────────────────────────────────────────────
// The service already supports isAdmin=true; this route just makes it reachable.
router.delete("/reviews/:id", reviewController.deleteReview);

// ── Coupon Management ────────────────────────────────────────────────────────
router.get("/coupons", couponController.getCoupons);
router.post("/coupons", couponController.createCoupon);
router.patch("/coupons/:id/deactivate", couponController.deactivateCoupon);

export default router;

