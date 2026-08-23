/**
 * Integration tests: Product Search flexible filters (Task 1), rating sort
 * (Task 2), and New Arrivals (Task 3).
 *
 * Non-transactional — getProducts/getNewArrivals are plain find/count
 * queries, and createReview/deleteReview's rating sync is a plain
 * aggregate + updateOne, so (unlike checkout) these run fine against a
 * standalone MongoMemoryServer instance with no replica set needed.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { connectTestDb, disconnectTestDb, clearDatabase } from "./testSetup.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import * as productService from "../services/productService.js";
import * as reviewService from "../services/reviewService.js";

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_jwt_secret_at_least_32_characters_long";
  process.env.REFRESH_TOKEN_SECRET = "test_refresh_secret_at_least_32_chars";
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearDatabase();
});

const makeProduct = (overrides = {}) =>
  Product.create({
    name: "Test Shirt",
    brand: "TestBrand",
    description: "A test product",
    price: 500,
    category: "top",
    colorFamily: "white",
    formalityLevel: 2,
    gender: "unisex",
    seasonTags: ["summer"],
    occasionTags: ["casual"],
    images: ["https://example.com/img.jpg"],
    variants: [{ size: "M", stock: 10 }],
    isActive: true,
    ...overrides,
  });

describe("Product Search: flexible filters (Task 1)", () => {
  it("returns everything when no filters are applied", async () => {
    await makeProduct({ name: "A" });
    await makeProduct({ name: "B" });

    const { products, pagination } = await productService.getProducts({
      sort: "newest",
      page: 1,
      limit: 12,
    });

    expect(products).toHaveLength(2);
    expect(pagination.total).toBe(2);
  });

  it("filters by gender, brand, and formality together", async () => {
    await makeProduct({ name: "Womens Blazer", gender: "women", brand: "Zara", formalityLevel: 4 });
    await makeProduct({ name: "Mens Tee", gender: "men", brand: "H&M", formalityLevel: 1 });

    const { products } = await productService.getProducts({
      gender: "women",
      brand: "zara", // case-insensitive
      formality: 4,
      sort: "newest",
      page: 1,
      limit: 12,
    });

    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Womens Blazer");
  });

  it("filters by style tags", async () => {
    await makeProduct({ name: "Minimal Shirt", styleTags: ["minimal"] });
    await makeProduct({ name: "Streetwear Hoodie", styleTags: ["streetwear"] });

    const { products } = await productService.getProducts({
      style: "streetwear",
      sort: "newest",
      page: 1,
      limit: 12,
    });

    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Streetwear Hoodie");
  });

  it("applies price range filters", async () => {
    await makeProduct({ name: "Cheap", price: 200 });
    await makeProduct({ name: "Mid", price: 1000 });
    await makeProduct({ name: "Expensive", price: 5000 });

    const { products } = await productService.getProducts({
      minPrice: 500,
      maxPrice: 2000,
      sort: "newest",
      page: 1,
      limit: 12,
    });

    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Mid");
  });

  it("boosts travel occasion when destination is given without an explicit occasion", async () => {
    await makeProduct({ name: "Travel Jacket", occasionTags: ["travel"] });
    await makeProduct({ name: "Party Dress", occasionTags: ["party"] });

    const { products } = await productService.getProducts({
      destination: "Goa",
      sort: "newest",
      page: 1,
      limit: 12,
    });

    expect(products).toHaveLength(1);
    expect(products[0].name).toBe("Travel Jacket");
  });
});

describe("Product Search: rating sort (Task 2)", () => {
  it("sorts by averageRating descending, kept in sync by reviewService", async () => {
    const low = await makeProduct({ name: "Low rated" });
    const high = await makeProduct({ name: "High rated" });
    const user1 = new mongoose.Types.ObjectId();
    const user2 = new mongoose.Types.ObjectId();

    await reviewService.createReview(low._id, user1, { rating: 2, title: "meh", body: "meh review" });
    await reviewService.createReview(high._id, user1, { rating: 5, title: "great", body: "great review" });
    await reviewService.createReview(high._id, user2, { rating: 4, title: "good", body: "good review" });

    const { products } = await productService.getProducts({ sort: "rating", page: 1, limit: 12 });

    expect(products[0].name).toBe("High rated");
    expect(products[0].averageRating).toBeCloseTo(4.5, 1);
    expect(products[0].reviewCount).toBe(2);
    expect(products[1].averageRating).toBeCloseTo(2, 1);
  });

  it("recomputes the rating after a review is deleted", async () => {
    const product = await makeProduct();
    const user1 = new mongoose.Types.ObjectId();
    const user2 = new mongoose.Types.ObjectId();

    await reviewService.createReview(product._id, user1, { rating: 1, title: "bad", body: "bad review" });
    const review2 = await reviewService.createReview(product._id, user2, { rating: 5, title: "amazing", body: "amazing review" });

    await reviewService.deleteReview(review2._id, user2, false);

    const updated = await Product.findById(product._id);
    expect(updated.averageRating).toBe(1);
    expect(updated.reviewCount).toBe(1);
  });
});

describe("New Arrivals (Task 3)", () => {
  it("returns only active products, newest first, paginated", async () => {
    const older = await makeProduct({ name: "Older" });
    await new Promise((r) => setTimeout(r, 5));
    const newer = await makeProduct({ name: "Newer" });
    await makeProduct({ name: "Inactive", isActive: false });

    const { products, pagination } = await productService.getNewArrivals({ page: 1, limit: 12 });

    expect(products).toHaveLength(2);
    expect(products[0].name).toBe("Newer");
    expect(products[1].name).toBe("Older");
    expect(pagination.total).toBe(2);
  });
});
