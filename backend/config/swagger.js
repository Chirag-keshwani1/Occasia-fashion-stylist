import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./env.js";

// Swagger/OpenAPI 3.0 specification definition.
// swagger-jsdoc reads JSDoc @swagger comments from route files and merges
// them with this base definition. We don't annotate every route (that would
// be too verbose for a startup project) — instead we document the most
// important endpoints so the spec is genuinely useful.
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Occasia API",
      version: "1.0.0",
      description:
        "Production-ready AI-powered fashion platform API. Supports authentication, product catalog, cart, orders, wishlist, AI outfit generation, conversational stylist, reviews, recommendations, and image management.",
      contact: {
        name: "Occasia Team",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token obtained from POST /auth/login",
        },
      },
      schemas: {
        // --- Shared response wrappers ---
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string", example: "Success" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            pages: { type: "integer" },
          },
        },

        // --- Auth ---
        RegisterBody: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Priya Sharma" },
            email: { type: "string", format: "email", example: "priya@example.com" },
            password: { type: "string", minLength: 8, example: "SecurePass123" },
          },
        },
        LoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },

        // --- Product ---
        SizeVariant: {
          type: "object",
          properties: {
            size: { type: "string", example: "M" },
            stock: { type: "integer", example: 10 },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Linen Summer Shirt" },
            brand: { type: "string", example: "StyleCo" },
            description: { type: "string" },
            category: {
              type: "string",
              enum: ["top", "bottom", "footwear", "accessory", "outerwear"],
            },
            price: { type: "number", example: 1499 },
            currency: { type: "string", example: "INR" },
            images: { type: "array", items: { type: "string" } },
            variants: { type: "array", items: { $ref: "#/components/schemas/SizeVariant" } },
            seasonTags: { type: "array", items: { type: "string" } },
            occasionTags: { type: "array", items: { type: "string" } },
            colorFamily: { type: "string", example: "White" },
            formalityLevel: { type: "integer", minimum: 1, maximum: 5 },
            gender: { type: "string", enum: ["men", "women", "unisex"] },
            styleTags: { type: "array", items: { type: "string" } },
            averageRating: { type: "number", minimum: 0, maximum: 5 },
            reviewCount: { type: "integer" },
            isActive: { type: "boolean" },
            totalStock: { type: "integer" },
          },
        },

        // --- Cart ---
        CartItem: {
          type: "object",
          properties: {
            productId: { type: "string" },
            size: { type: "string" },
            qty: { type: "integer" },
            lineTotal: { type: "number" },
            inStock: { type: "boolean" },
          },
        },

        // --- Order ---
        OrderItem: {
          type: "object",
          properties: {
            productId: { type: "string" },
            size: { type: "string" },
            qty: { type: "integer" },
            priceAtOrder: { type: "number" },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
            totalAmount: { type: "number" },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // --- Review ---
        Review: {
          type: "object",
          properties: {
            _id: { type: "string" },
            productId: { type: "string" },
            userId: { type: "object", properties: { name: { type: "string" } } },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            title: { type: "string" },
            body: { type: "string" },
            verifiedPurchase: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // --- Outfit ---
        OutfitContext: {
          type: "object",
          description: "All fields are optional. 'Any', empty strings, null, and undefined are all treated as 'no filter'.",
          properties: {
            season: { type: "string", enum: ["summer", "winter", "fall", "spring"] },
            occasion: { type: "string", enum: ["casual", "formal", "beach", "travel", "party", "work"] },
            category: { type: "string", enum: ["top", "bottom", "footwear", "accessory", "outerwear"] },
            gender: { type: "string", enum: ["men", "women", "unisex"] },
            style: { type: "string", enum: ["minimal", "casual", "luxury", "streetwear", "smart_casual", "old_money", "korean", "party"] },
            color: { type: "string", maxLength: 40 },
            brand: { type: "string", maxLength: 60 },
            formality: { type: "integer", minimum: 1, maximum: 5 },
            destination: { type: "string", maxLength: 80 },
            budget: { type: "number" },
            minPrice: { type: "number" },
            maxPrice: { type: "number" },
            stylePreference: { type: "string", maxLength: 120 },
          },
        },

        // --- Chat ---
        ChatMessage: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["user", "assistant"] },
            content: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Registration, login, token refresh, logout" },
      { name: "Products", description: "Public product catalog with filtering and pagination" },
      { name: "Cart", description: "Server-side cart with real-time stock validation" },
      { name: "Orders", description: "Transactional checkout with atomic stock decrement" },
      { name: "Wishlist", description: "User wishlist management" },
      { name: "Reviews", description: "Product reviews and ratings with verified purchase flags" },
      { name: "Outfits", description: "AI-powered outfit generation using Groq + RAG" },
      { name: "Chat", description: "Conversational AI stylist (multi-turn)" },
      { name: "Recommendations", description: "Personalized, similar, and trending product picks" },
      { name: "Recently Viewed", description: "User product view history" },
      { name: "Admin", description: "Admin-only: product/order management, image uploads" },
    ],
    // Apply BearerAuth globally as the default — individual routes can override
    security: [{ BearerAuth: [] }],
  },
  // Glob pattern pointing to route files that contain @swagger JSDoc comments
  apis: ["./routes/*.js", "./controllers/*.js"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
