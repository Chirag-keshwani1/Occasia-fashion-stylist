import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Product from './models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function fixProduct() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    const docs = await collection.find({}).toArray();
    
    for (const doc of docs) {
      if (doc.name === 'Relaxed Fit Printed T-shirt ') {
        console.log('Fixing product:', doc._id);
        
        // Remove the invalid document first to bypass schema validation errors
        // on update, then re-insert it properly via the Model
        await collection.deleteOne({ _id: doc._id });

        const newProduct = new Product({
          name: doc.name.trim(),
          brand: doc.brand,
          gender: 'men',
          category: 'top',
          price: 999,
          currency: 'INR',
          colorFamily: 'red',
          styleTags: ['casual', 'smart-casual', 'layering'],
          occasionTags: ['casual', 'travel'],
          seasonTags: ['summer', 'spring', 'fall'],
          formalityLevel: 1, // casual
          images: doc.images,
          externalUrl: doc.productUrl,
          isActive: true,
          variants: [
            { size: 'S', stock: 10 },
            { size: 'M', stock: 15 },
            { size: 'L', stock: 10 }
          ],
          description: `Relaxed fit printed t-shirt. Material: ${doc.material || 'cotton'}. Neckline: ${doc.neckline || 'round neck'}.`
        });

        await newProduct.save();
        console.log('Product saved successfully with proper schema!');
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixProduct();
