import express from "express";
import * as productController from "../controllers/productController.js";
import * as recommendationController from "../controllers/recommendationController.js";
import { validateQuery } from "../middleware/validate.js";
import { productQuerySchema } from "../validations/productValidation.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List products with flexible, fully-optional filtering and pagination
 *     description: >
 *       Every filter is optional. "Any", empty strings, null, and undefined
 *       are all treated as "no filter" — send any combination of these
 *       query params, or none at all.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *           enum: [summer, winter, fall, spring]
 *       - in: query
 *         name: occasion
 *         schema:
 *           type: string
 *           enum: [casual, formal, beach, travel, party, work]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [top, bottom, footwear, accessory, outerwear]
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [men, women, unisex]
 *       - in: query
 *         name: style
 *         schema:
 *           type: string
 *           enum: [minimal, casual, luxury, streetwear, smart_casual, old_money, korean, party]
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: formality
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Not a stored product field — boosts travel-appropriate products when no explicit occasion is given.
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, rating]
 *           default: newest
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Paginated product list with metadata
 */
router.get("/", validateQuery(productQuerySchema), productController.listProducts);

/**
 * @swagger
 * /products/new-arrivals:
 *   get:
 *     tags: [Products]
 *     summary: Recently added active products, paginated
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: Paginated list of the newest active products
 */
// Must be registered before /:id so "new-arrivals" isn't swallowed as a product id.
router.get("/new-arrivals", validateQuery(productQuerySchema), productController.listNewArrivals);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a single product by ID
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
// optionalAuth: logged-in users get their views recorded automatically;
// guests still get the product without any auth barrier.
router.get("/:id", optionalAuth, productController.getProduct);

// Product detail page recommendation sub-routes
// All public — no auth required. Powered entirely by MongoDB aggregation,
// no AI cost. These populate the various "You might also like" sections.
router.get("/:id/similar", recommendationController.getSimilar);
router.get("/:id/complete-the-look", recommendationController.getCompleteTheLook);
router.get("/:id/frequently-bought-together", recommendationController.getFrequentlyBoughtTogether);
router.get("/:id/more-from-brand", recommendationController.getMoreFromBrand);
router.get("/:id/alternatives", recommendationController.getPriceAlternatives);
router.get("/:id/customers-also-viewed", recommendationController.getCustomersAlsoViewed);

export default router;
