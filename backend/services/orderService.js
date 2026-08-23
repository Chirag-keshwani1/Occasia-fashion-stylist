import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import IdempotencyKey from "../models/IdempotencyKey.js";
import { validateCoupon, incrementCouponUsage } from "./couponService.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { logger } from "../config/logger.js";

/**
 * Converts the user's current cart into a real order.
 *
 * Supports optional coupon code and shipping address.
 * The coupon is validated BEFORE the DB transaction starts — it fails fast
 * (no session overhead) if the coupon is invalid, and the usage counter is
 * incremented AFTER the transaction commits to avoid phantom increments on
 * rollback.
 *
 * Idempotency: if the caller passes `idempotencyKey` (from the client's
 * "Idempotency-Key" header), repeating the exact same key — a double click
 * on "Place Order", or a network retry after a timeout — returns the
 * original order instead of creating a second one. See IdempotencyKey.js
 * for how the key is claimed atomically via a unique index.
 */
export const checkout = async (userId, { couponCode, shippingAddress, idempotencyKey } = {}) => {
  // ── Idempotency: claim the key BEFORE doing any real work ──────────────
  // Inserting is atomic — if two requests race with the same key, only one
  // insert can win (the unique index rejects the second with code 11000).
  let idempotencyRecord = null;
  if (idempotencyKey) {
    try {
      idempotencyRecord = await IdempotencyKey.create({
        key: idempotencyKey,
        userId,
        endpoint: "checkout",
      });
    } catch (err) {
      if (err.code === 11000) {
        const existing = await IdempotencyKey.findOne({ userId, endpoint: "checkout", key: idempotencyKey });
        if (existing?.status === "completed" && existing.orderId) {
          const existingOrder = await Order.findById(existing.orderId).populate("items.productId");
          if (existingOrder) {
            logger.info(`Checkout replayed for idempotency key ${idempotencyKey} — returning existing order ${existingOrder._id}`);
            return existingOrder;
          }
        }
        // Key exists but isn't resolved to a completed order yet — either a
        // concurrent request is still mid-flight, or a prior attempt failed
        // and left the key claimed. Either way we must NOT proceed and risk
        // a second order; the client should retry shortly.
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          "This checkout request is already being processed. Please wait a moment and try again."
        );
      }
      throw err;
    }
  }

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Your cart is empty");
    }

    // ── Coupon pre-validation (outside the transaction for efficiency) ─────────
    // We'll compute the actual subtotal inside the transaction, so we just
    // check the coupon's general validity here and apply the discount after.
    let couponResult = null;
    if (couponCode) {
      // Fetch current product prices to compute a temporary subtotal for validation
      const productIds = cart.items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds }, isActive: true });
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      const tempSubtotal = cart.items.reduce((sum, item) => {
        const p = productMap.get(item.productId.toString());
        return sum + (p ? p.price * item.qty : 0);
      }, 0);

      const cartItemsWithCategory = cart.items.map((item) => {
        const p = productMap.get(item.productId.toString());
        return { category: p?.category, price: p?.price || 0, qty: item.qty };
      });

      couponResult = await validateCoupon(couponCode, userId, tempSubtotal, cartItemsWithCategory);
    }

    // ── MongoDB transaction ───────────────────────────────────────────────────
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        const orderItems = [];
        let subtotal = 0;

        for (const item of cart.items) {
          // Atomic stock decrement — race condition safe
          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              isActive: true,
              variants: { $elemMatch: { size: item.size, stock: { $gte: item.qty } } },
            },
            { $inc: { "variants.$[variant].stock": -item.qty } },
            {
              arrayFilters: [{ "variant.size": item.size }],
              new: true,
              session,
            }
          );

          if (!updatedProduct) {
            throw new ApiError(
              HTTP_STATUS.CONFLICT,
              `Not enough stock for one of the items in your cart (size ${item.size}). Please review your cart.`
            );
          }

          orderItems.push({
            productId: item.productId,
            size: item.size,
            qty: item.qty,
            priceAtOrder: updatedProduct.price,
          });
          subtotal += updatedProduct.price * item.qty;
        }

        // Apply coupon discount to the real subtotal computed inside the transaction
        const discount = couponResult ? couponResult.discount : 0;
        const total = Math.max(0, subtotal - discount);

        const couponSnapshot = couponResult
          ? {
              code: couponResult.coupon.code,
              discount,
              type: couponResult.coupon.type,
            }
          : { code: null, discount: 0, type: null };

        const createdOrders = await Order.create(
          [{
            userId,
            items: orderItems,
            subtotal,
            coupon: couponSnapshot,
            total,
            shippingAddress: shippingAddress || null,
          }],
          { session }
        );
        order = createdOrders[0];

        cart.items = [];
        await cart.save({ session });
      });

      // Increment coupon usage AFTER the transaction commits successfully
      if (couponResult) {
        await incrementCouponUsage(couponResult.coupon.code);
      }

      logger.info(`Order ${order._id} created for user ${userId}, total: ${order.total}`);

      if (idempotencyRecord) {
        idempotencyRecord.status = "completed";
        idempotencyRecord.orderId = order._id;
        await idempotencyRecord.save();
      }

      return order;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    // This attempt failed — release the key so the same idempotency key can
    // be retried later instead of being permanently stuck as "processing".
    if (idempotencyRecord) {
      await IdempotencyKey.deleteOne({ _id: idempotencyRecord._id }).catch(() => {});
    }
    throw err;
  }
};

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
