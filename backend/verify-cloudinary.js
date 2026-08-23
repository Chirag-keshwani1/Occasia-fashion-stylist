import cloudinary from 'cloudinary';
import { config } from './config/env.js';
import TryOnResult from './models/TryOnResult.js';
import mongoose from 'mongoose';

async function checkCloudinaryState() {
  console.log("Connecting to DB to find the latest TryOnResult...");
  await mongoose.connect(config.MONGO_URI);
  
  const latestResult = await TryOnResult.findOne().sort({ createdAt: -1 });
  if (!latestResult) {
    console.log("❌ No TryOnResult found in DB.");
    process.exit(1);
  }
  
  console.log("Latest TryOnResult found:");
  console.log(`- Result Image URL: ${latestResult.resultImageUrl}`);
  
  // Try to find if any person images are left in the tryon_temp folder
  console.log("\nChecking Cloudinary 'occasia/tryon_temp' folder for orphaned person images...");
  try {
    const result = await cloudinary.v2.api.resources({
      type: 'upload',
      prefix: 'occasia/tryon_temp/'
    });
    
    if (result.resources.length === 0) {
      console.log("✅ Verified: 'occasia/tryon_temp' is EMPTY. Person image was successfully deleted!");
    } else {
      console.error("❌ FAILED: Found orphaned images in 'occasia/tryon_temp':");
      result.resources.forEach(r => console.log(`  - ${r.public_id}`));
    }
  } catch (error) {
    console.error("Error querying Cloudinary:", error.message);
  }
  
  process.exit(0);
}

checkCloudinaryState().catch(console.error);
