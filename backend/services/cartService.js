import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Every user has exactly one cart. This either finds it or creates an
// empty one — callers never have to think about "does this user have a
// cart yet", which removes a whole category of null-check bugs.
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

// Checks the product exists, is active, has the requested size, and has
// enough stock in that size. Reused by both "add" and "update quantity",
// since both need the same real-world checks against the current catalog
// state — stock can change between when someone loads the page and when
// they actually add to cart.
const validateAvailability = async (productId, size, qty) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  const variant = product.variants.find((v) => v.size === size);
  if (!variant) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Size "${size}" is not available for this product`);
  }

  if (variant.stock < qty) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Only ${variant.stock} left in size ${size}`
    );
  }

  return product;
};

export const addItem = async (userId, { productId, size, qty }) => {
  await validateAvailability(productId, size, qty);

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find(
    (item) => item.productId.toString() === productId && item.size === size
  );

  if (existing) {
    // Same product + same size already in cart — increase the quantity
    // instead of creating a duplicate line. Re-check stock against the
    // COMBINED quantity, not just the new amount being added.
    await validateAvailability(productId, size, existing.qty + qty);
    existing.qty += qty;
  } else {
    cart.items.push({ productId, size, qty });
  }

  await cart.save();
  return cart;
};

export const updateItemQty = async (userId, productId, size, qty) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart is empty");
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId && item.size === size
  );
  if (itemIndex === -1) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Item not found in cart");
  }

  if (qty === 0) {
    cart.items.splice(itemIndex, 1); // qty 0 = remove the item
  } else {
    await validateAvailability(productId, size, qty);
    cart.items[itemIndex].qty = qty;
  }

  await cart.save();
  return cart;
};

export const removeItem = async (userId, productId, size) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Cart is empty");
  }

  const beforeCount = cart.items.length;
  cart.items = cart.items.filter(
    (item) => !(item.productId.toString() === productId && item.size === size)
  );

  if (cart.items.length === beforeCount) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Item not found in cart");
  }

  await cart.save();
  return cart;
};

// Builds the full cart view: fetches current product data for every item
// (never trusting any stored price), computes a line total per item and
// a grand subtotal. Also flags any item where the requested quantity now
// exceeds available stock — the front end can show a warning without the
// item silently disappearing.
export const getCartWithDetails = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) {
    return { items: [], subtotal: 0 };
  }

  const productIds = cart.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  const items = cart.items
    .map((item) => {
      const product = productMap.get(item.productId.toString());
      if (!product || !product.isActive) return null; // dropped from view, not from the DB — see note below

      const variant = product.variants.find((v) => v.size === item.size);
      const lineTotal = product.price * item.qty;
      subtotal += lineTotal;

      return {
        productId: product._id,
        product,
        size: item.size,
        qty: item.qty,
        lineTotal,
        inStock: variant ? variant.stock >= item.qty : false,
      };
    })
    .filter(Boolean);

  return { items, subtotal };
};

export const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ userId }, { items: [] });
};
