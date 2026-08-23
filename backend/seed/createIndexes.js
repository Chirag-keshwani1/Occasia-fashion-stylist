import "../config/env.js";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { logger } from "../config/logger.js";

async function createIndexes() {
  await connectDB();
  const collection = mongoose.connection.collection("products");

  logger.info("Creating index: { seasonTags: 1, category: 1 }");
  await collection.createIndex({ seasonTags: 1, category: 1 });

  logger.info("Creating index: { occasionTags: 1, category: 1 }");
  await collection.createIndex({ occasionTags: 1, category: 1 });

  logger.info("Creating index: { gender: 1 }");
  await collection.createIndex({ gender: 1 });

  logger.info("Creating index: { styleTags: 1 }");
  await collection.createIndex({ styleTags: 1 });

  logger.info("Creating index: { averageRating: -1 } (powers ?sort=rating)");
  await collection.createIndex({ averageRating: -1 });

  logger.info("Creating index: { isActive: 1, createdAt: -1 } (powers New Arrivals)");
  await collection.createIndex({ isActive: 1, createdAt: -1 });

  const indexes = await collection.indexes();
  logger.info(`Done. Current indexes: ${indexes.map((i) => i.name).join(", ")}`);

  await mongoose.disconnect();
  process.exit(0);
}

createIndexes().catch((err) => {
  logger.error(`Index creation failed: ${err.message}`);
  process.exit(1);
});