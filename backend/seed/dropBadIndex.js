import "../config/env.js";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { logger } from "../config/logger.js";

const BAD_INDEX_NAME = "seasonTags_1_occasionTags_1_category_1";

async function dropBadIndex() {
  await connectDB();
  const collection = mongoose.connection.collection("products");

  const indexes = await collection.indexes();
  const exists = indexes.some((i) => i.name === BAD_INDEX_NAME);

  if (!exists) {
    logger.info(`Index "${BAD_INDEX_NAME}" not found — nothing to drop.`);
  } else {
    await collection.dropIndex(BAD_INDEX_NAME);
    logger.info(`Dropped broken index "${BAD_INDEX_NAME}"`);
  }

  const remaining = await collection.indexes();
  logger.info(`Remaining indexes: ${remaining.map((i) => i.name).join(", ")}`);

  await mongoose.disconnect();
  process.exit(0);
}

dropBadIndex().catch((err) => {
  logger.error(`Failed: ${err.message}`);
  process.exit(1);
});