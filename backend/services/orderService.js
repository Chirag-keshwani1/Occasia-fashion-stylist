import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { logger } from "../config/logger.js";

export const getMyOrders = async (userId) => {
  return Order.find({ userId }).populate("items.productId").sort({ createdAt: -1 });
};

export const getOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, userId }).populate("items.productId");
  if (!order) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");
  }
  return order;
};

// Statuses an order can still be cancelled from. Once shipped/delivered,
// cancellation should go through a returns flow instead — and an already
// "cancelled" order is deliberately excluded so a repeated cancel request
// is a no-op rather than restoring stock twice.
const CANCELLABLE_STATUSES = ["pending", "confirmed", "shipped"];

/**
 * Atomically restores stock for every item in an order back onto its
 * product's matching size variant. Shared by the user-facing cancel
 * endpoint and the admin status-update path so stock restoration logic
 * lives in exactly one place.
 */
const restoreOrderStock = async (order, session) => {
  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.productId, "variants.size": item.size },
      { $inc: { "variants.$.stock": item.qty } },
      { session }
    );
  }
};

/**
 * Cancel one of the current user's own orders.
 *
 * Restores stock for every item's size variant, atomically, and is safe to
 * call more than once for the same order: the status transition and the
 * stock restoration both happen inside one transaction, and the update
 * that flips status to "cancelled" only matches orders that are NOT
 * already cancelled (`status: { $ne: "cancelled" }`). If two cancel
 * requests race, only the first one finds a matching document to update —
 * the second sees status already "cancelled" and is rejected before any
 * stock is touched a second time.
 */
export const cancelOrder = async (userId, orderId) => {
  const session = await mongoose.startSession();
  try {
    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          userId,
          status: { $in: CANCELLABLE_STATUSES },
        },
        { status: "cancelled" },
        { new: false, session } // old doc — we need its (unchanged) items to restore stock
      );

      if (!order) {
        // Either the order doesn't belong to this user, doesn't exist, or
        // is no longer in a cancellable state (already cancelled, or
        // already delivered) — in every case, nothing should be restored.
        const existing = await Order.findOne({ _id: orderId, userId }).session(session);
        if (!existing) {
          throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");
        }
        if (existing.status === "cancelled") {
          throw new ApiError(HTTP_STATUS.CONFLICT, "This order has already been cancelled");
        }
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          `Order cannot be cancelled once it is ${existing.status}`
        );
      }

      await restoreOrderStock(order, session);
      cancelledOrder = order;
    });

    logger.info(`Order ${orderId} cancelled by user ${userId}, stock restored`);
    return getOrderById(userId, orderId);
  } finally {
    await session.endSession();
  }
};

// --- Admin operations ---

export const getAllOrders = async ({ page, limit, status }) => {
  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("userId", "name email")
      .populate("items.productId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Order.countDocuments(filter),
  ]);

  return { orders, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

/**
 * Admin status update. When the new status is "cancelled", this goes
 * through the same atomic restore-stock path as the user-facing cancel —
 * an admin force-cancelling an order must restore stock too, and must be
 * just as safe against duplicate restoration if called twice (e.g. a
 * double click in the admin panel).
 */
export const updateOrderStatus = async (orderId, status) => {
  if (status === "cancelled") {
    const session = await mongoose.startSession();
    try {
      let updated;
      await session.withTransaction(async () => {
        const order = await Order.findOneAndUpdate(
          { _id: orderId, status: { $ne: "cancelled" } },
          { status: "cancelled" },
          { new: false, session }
        );

        if (!order) {
          // Either it doesn't exist, or it's already cancelled — in the
          // latter case this is an idempotent no-op, not an error, so an
          // admin re-submitting the same status update doesn't get a
          // confusing failure.
          const existing = await Order.findById(orderId).session(session);
          if (!existing) {
            throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");
          }
          updated = existing;
          return;
        }

        await restoreOrderStock(order, session);
        updated = await Order.findById(orderId).session(session);
      });
      return updated;
    } finally {
      await session.endSession();
    }
  }

  const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
  if (!order) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Order not found");
  }
  return order;
};
