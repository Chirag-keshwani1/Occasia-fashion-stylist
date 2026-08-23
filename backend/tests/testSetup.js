/**
 * Test bootstrap — shared setup/teardown for all integration tests.
 *
 * Uses mongodb-memory-server to spin up an in-process MongoDB instance,
 * so tests never touch the real database and can run offline.
 * Each test file that imports this will share a server lifecycle.
 *
 * IMPORTANT: this must be a (single-node) replica set, not a plain
 * standalone instance. orderService.checkout and orderService.cancelOrder
 * both use mongoose sessions/transactions for atomicity — a standalone
 * mongod has no replica set at all, so the server rejects ANY
 * session/transaction-bearing operation sent to it outright (that
 * rejection is what surfaces as "This MongoDB deployment does not support
 * retryable writes" — the same underlying wire-protocol mechanism backs
 * both retryable writes and transactions, so a standalone server gives
 * that error for both). MongoMemoryReplSet actually starts replication
 * (even with a single member), which is what makes transactions work.
 */
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoReplSet;

export const connectTestDb = async () => {
  mongoReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  const uri = mongoReplSet.getUri();
  await mongoose.connect(uri, { dbName: "occasia_test" });
};

export const disconnectTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoReplSet.stop();
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
