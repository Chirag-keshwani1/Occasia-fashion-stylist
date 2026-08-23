import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import compression from "compression";

import { config } from "./config/env.js";
import { morganStream } from "./config/logger.js";
import { isDbConnected } from "./config/db.js";
import { sendResponse } from "./utils/ApiResponse.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import apiRoutes from "./routes/index.js";

const app = express();

// --- Security headers (Helmet) ---
// Helmet sets a collection of well-known security headers.
// In production we use defaults. In development, CSP is relaxed so
// Swagger UI can load its inline scripts without errors.
app.use(
  helmet({
    contentSecurityPolicy: config.NODE_ENV === "production"
      ? undefined        // use helmet's secure default CSP in production
      : false,           // disable CSP in dev so Swagger UI renders correctly
    crossOriginEmbedderPolicy: config.NODE_ENV === "production",
  })
);

// CORS locked to a single known origin. Wildcard origin ("*") combined
// with credentials:true is both rejected by browsers and a real
// vulnerability for any app using cookies — it would let any site make
// authenticated requests on behalf of a logged-in user.
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  })
);

// --- Global rate limiter ---
// Applied BEFORE any routes — this baseline limit protects every endpoint
// in the app. Individual endpoints (auth, AI) layer tighter limits on top.
app.use("/api", apiLimiter);

// Body parsers — limit is 10mb to comfortably accommodate base64 previews.
// multipart/form-data (file uploads) is NOT parsed here; multer handles that
// on the specific routes that need it so random endpoints don't accept files.
// Gzip compression — reduces JSON response size by 60-80%.
// Applied before body parsers so the response pipeline benefits immediately.
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// HTTP request logs flow through Winston too, so ALL logs — request
// traffic and application events — go through one consistent pipeline
// instead of two separate ones.
if (config.NODE_ENV !== "test") {
  app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev", { stream: morganStream }));
}

// --- Health checks, split by concern ---

// Liveness: "is the process up?" Used by uptime monitors / deploy
// platforms. Deliberately does NOT touch the database — a slow DB
// shouldn't report the whole service as down.
app.get("/health", (req, res) => {
  sendResponse(res, 200, { uptime: process.uptime(), env: config.NODE_ENV }, "Service is healthy");
});

// Readiness/dependency check: "is the DB actually connected?" Separate
// endpoint so you can debug DB connectivity without conflating it with
// whether the process itself is alive.
app.get("/health/db", (req, res) => {
  const connected = isDbConnected();
  sendResponse(
    res,
    connected ? 200 : 503,
    { dbConnected: connected },
    connected ? "Database connected" : "Database not connected"
  );
});

// --- API Documentation (Swagger UI) ---
// Only available in non-production environments. In production, API docs
// should either be behind authentication or served from a separate service.
if (config.NODE_ENV !== "production") {
  // Dynamic import keeps swagger-ui-express out of the critical path in prod
  const { default: swaggerUi } = await import("swagger-ui-express");
  const { swaggerSpec } = await import("./config/swagger.js");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Occasia API Docs",
    customCss: ".swagger-ui .topbar { display: none }",
  }));
}

// --- All feature routes, mounted under /api ---
app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;