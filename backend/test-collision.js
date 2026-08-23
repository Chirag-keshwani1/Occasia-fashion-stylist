import mongoose from "mongoose";
import { config } from "../backend/config/env.js";
import User from "../backend/models/User.js";
import * as authService from "../backend/services/authService.js";
import bcrypt from "bcryptjs";

async function runTest() {
  await mongoose.connect(config.MONGO_URI);
  console.log("Connected to MongoDB");

  // 1. Create a local user
  const email = "testcollision@example.com";
  const plainPassword = "supersecretpassword";
  const passwordHash = await bcrypt.hash(plainPassword, 12);
  
  await User.deleteOne({ email }); // Cleanup
  
  const localUser = await User.create({
    name: "Local User",
    email,
    passwordHash,
    authProvider: "local"
  });
  console.log("Created local user:", { _id: localUser._id, authProvider: localUser.authProvider, hasPassword: !!localUser.passwordHash });

  // 2. Simulate Supabase sync for the same email
  console.log("\nSimulating Supabase sync...");
  const { user: syncedUser } = await authService.supabaseSync({
    email,
    name: "Google Name"
  });

  // 3. Fetch from DB again to verify it didn't change
  const dbUser = await User.findById(syncedUser._id).select("+passwordHash");
  
  console.log("\nResulting User in DB:");
  console.log("- _id matched:", dbUser._id.toString() === localUser._id.toString());
  console.log("- authProvider:", dbUser.authProvider, "(Expected: local)");
  console.log("- passwordHash intact:", dbUser.passwordHash === passwordHash);
  
  const canStillLogin = await bcrypt.compare(plainPassword, dbUser.passwordHash);
  console.log("- Can still login with local password:", canStillLogin);

  // Cleanup
  await User.deleteOne({ email });
  await mongoose.disconnect();
}

runTest().catch(console.error);
