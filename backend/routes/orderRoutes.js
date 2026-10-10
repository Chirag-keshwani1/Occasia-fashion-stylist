import express from "express";
import * as orderController from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);


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
