import "../config/env.js";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { logger } from "../config/logger.js";

async function checkIndexes() {
  await connectDB();

  const collections = await mongoose.connection.db.listCollections().toArray();
  logger.info(`Collections in this database: ${collections.map((c) => c.name).join(", ") || "(none)"}`);

  const exists = collections.some((c) => c.name === "products");
  if (!exists) {
    logger.info("The products collection does not exist yet in this database.");
  } else {
    const collection = mongoose.connection.collection("products");
    const indexes = await collection.indexes();
    logger.info("Indexes currently on products collection:");
    console.log(JSON.stringify(indexes, null, 2));

    const count = await collection.countDocuments();
    logger.info(`Document count in products: ${count}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

checkIndexes().catch((err) => {
  logger.error(`Check failed: ${err.message}`);
  process.exit(1);
});