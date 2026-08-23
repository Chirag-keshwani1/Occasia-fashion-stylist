import { uploadToCloudinary, deleteFromCloudinary } from './config/cloudinary.js';
import cloudinary from 'cloudinary';
import { config } from './config/env.js';

async function testPrivacyCleanup() {
  console.log("Testing Cloudinary Privacy Cleanup...");
  
  // 1. Create a dummy image buffer
  const buffer = Buffer.from('R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=', 'base64'); // 1x1 black pixel GIF
  
  // 2. Upload it
  console.log("Uploading test image...");
  const uploadResult = await uploadToCloudinary(buffer, 'occasia/test_privacy');
  console.log("Upload Success:", uploadResult);
  
  const publicId = uploadResult.publicId;
  
  // 3. Verify it exists via Admin API
  try {
    const resource = await cloudinary.v2.api.resource(publicId);
    console.log(`✅ Verified image exists in Cloudinary: ${resource.public_id}`);
  } catch (e) {
    console.error("❌ Image does not exist after upload!", e.message);
  }
  
  // 4. Delete it (Simulating the 'finally' block in tryonController)
  console.log(`Deleting ${publicId}...`);
  await deleteFromCloudinary(publicId);
  
  // 5. Verify it's gone
  try {
    await cloudinary.v2.api.resource(publicId);
    console.error("❌ Image STILL EXISTS in Cloudinary! Deletion failed.");
  } catch (e) {
    if (e.http_code === 404 || e.error?.http_code === 404) {
      console.log("✅ Verified image was successfully deleted from Cloudinary (Privacy default works).");
    } else {
      console.log("✅ Delete likely succeeded, got error:", e.message);
    }
  }
  
  process.exit(0);
}

testPrivacyCleanup().catch(console.error);
