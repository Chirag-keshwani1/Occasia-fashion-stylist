import express from "express";
import * as orderController from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     tags: [Orders]
 *     summary: Convert the current user's cart into an order
 *     description: >
 *       Reads directly from the Cart collection — takes no item data in the
 *       body. To protect against duplicate orders from a double click on
 *       "Place Order" or a network retry, pass a client-generated
 *       "Idempotency-Key" header; repeating the same key returns the
 *       original order instead of creating a second one.
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: false
 *         schema:
 *           type: string
 *         description: A unique key per checkout attempt (e.g. a UUID generated client-side when the order form is opened).
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               couponCode:
 *                 type: string
 *               shippingAddress:
 *                 type: object
 *     responses:
 *       201:
 *         description: Order placed
 *       409:
 *         description: Duplicate checkout request already in progress
 */
router.post("/checkout", orderController.checkout);

router.get("/mine", orderController.getMyOrders);
router.get("/mine/:id", orderController.getMyOrderById);

/**
 * @swagger
 * /orders/mine/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel one of the current user's own orders and restore stock
 *     description: >
 *       Only orders in pending/confirmed/shipped status can be cancelled.
 *       Restores each item's size-variant stock atomically. Safe to call
 *       more than once — a repeated cancel on an already-cancelled order
 *       returns a 409 instead of restoring stock a second time.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled and stock restored
 *       404:
 *         description: Order not found
 *       409:
 *         description: Order already cancelled or no longer cancellable
 */
router.post("/mine/:id/cancel", orderController.cancelOrder);

export default router;
