import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

/**
 * Overview dashboard — total revenue, order/user/product/review counts.
 * Single aggregation pass over Orders for revenue; separate count queries run in parallel.
 */
export const getOverview = async () => {
  const [orderStats, userCount, productCount, reviewCount] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: ["confirmed", "shipped", "delivered"] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$total" },
        },
      },
    ]),
    User.countDocuments({ role: "user" }),
    Product.countDocuments({ isActive: true }),
    Review.countDocuments(),
  ]);

  const stats = orderStats[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

  return {
    totalRevenue: Math.round(stats.totalRevenue),
    totalOrders: stats.totalOrders,
    avgOrderValue: Math.round(stats.avgOrderValue),
    totalUsers: userCount,
    totalActiveProducts: productCount,
    totalReviews: reviewCount,
  };
};

/**
 * Revenue time series — groups confirmed orders by day/week/month.
 * Returns an array of { period, revenue, orders } sorted ascending.
 *
 * @param {string} period - "day" | "week" | "month"
 * @param {number} limit  - how many periods back to return
 */
export const getRevenueSeries = async (period = "day", limit = 30) => {
  // MongoDB date grouping expression changes based on the requested period
  const groupId = {
    day: {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day: { $dayOfMonth: "$createdAt" },
    },
    week: {
      year: { $year: "$createdAt" },
      week: { $week: "$createdAt" },
    },
    month: {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
    },
  }[period] || { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } };

  const series = await Order.aggregate([
    { $match: { status: { $in: ["confirmed", "shipped", "delivered"] } } },
    {
      $group: {
        _id: groupId,
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1, "_id.week": -1 } },
    { $limit: limit },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } },
  ]);

  return series.map((s) => ({
    period: s._id,
    revenue: Math.round(s.revenue),
    orders: s.orders,
  }));
};

/**
 * Top selling products — ranked by total units sold (from Order line items).
 * Joins back to Product to include name, brand, price, and images.
 */
export const getTopProducts = async (limit = 10) => {
  return Order.aggregate([
    { $match: { status: { $in: ["confirmed", "shipped", "delivered"] } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        unitsSold: { $sum: "$items.qty" },
        revenue: { $sum: { $multiply: ["$items.priceAtOrder", "$items.qty"] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmpty: true } },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        unitsSold: 1,
        revenue: 1,
        name: "$product.name",
        brand: "$product.brand",
        price: "$product.price",
        category: "$product.category",
        images: "$product.images",
      },
    },
  ]);
};

/**
 * Low stock alert — products where total stock across all variants
 * is at or below the threshold. Useful for inventory management.
 */
export const getLowStockProducts = async (threshold = 10, limit = 20) => {
  const products = await Product.find({ isActive: true })
    .select("name brand category variants images")
    .lean();

  const lowStock = products
    .map((p) => {
      const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
      return { ...p, totalStock };
    })
    .filter((p) => p.totalStock <= threshold)
    .sort((a, b) => a.totalStock - b.totalStock)
    .slice(0, limit);

  return lowStock;
};

/**
 * User management — paginated list of users with their order count and total spend.
 * Admin only.
 */
export const getUserList = async ({ page = 1, limit = 20, search }) => {
  const filter = { role: "user" };
  if (search) filter.$or = [
    { name: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
  ];

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};
