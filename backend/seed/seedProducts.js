// Run with: npm run seed
// Wipes the products collection and loads a fresh, realistic sample
// catalog — so the app has real data to test against without you having
// to enter it by hand through the admin panel (which doesn't exist until
// Milestone 4 anyway).
import "../config/env.js";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { logger } from "../config/logger.js";
import Product from "../models/Product.js";

console.log("ACTIVE INDEXES:", JSON.stringify(Product.schema.indexes()));

const clothingVariants = [
  { size: "S", stock: 12 },
  { size: "M", stock: 20 },
  { size: "L", stock: 15 },
  { size: "XL", stock: 8 },
];
const shoeVariants = [
  { size: "7", stock: 6 },
  { size: "8", stock: 10 },
  { size: "9", stock: 10 },
  { size: "10", stock: 5 },
];
const oneSize = [{ size: "One Size", stock: 25 }];

const products = [
  { name: "Linen Short-Sleeve Shirt", brand: "Zara", category: "top", price: 1999, colorFamily: "white", formalityLevel: 2, seasonTags: ["summer"], occasionTags: ["casual", "travel", "beach"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1596755094514-f87e32f85e23?auto=format&fit=crop&w=600&q=80"] },
  { name: "Crochet Knit Top", brand: "H&M", category: "top", price: 1499, colorFamily: "beige", formalityLevel: 2, seasonTags: ["summer"], occasionTags: ["casual", "beach"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=600&q=80"] },
  { name: "Relaxed Linen Pants", brand: "Zara", category: "bottom", price: 2499, colorFamily: "beige", formalityLevel: 2, seasonTags: ["summer"], occasionTags: ["casual", "travel"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1594938298596-70f594f742f8?auto=format&fit=crop&w=600&q=80"] },
  { name: "Cotton Chino Shorts", brand: "H&M", category: "bottom", price: 1299, colorFamily: "navy", formalityLevel: 2, seasonTags: ["summer"], occasionTags: ["casual", "travel", "beach"], variants: clothingVariants },
  { name: "Woven Leather Sandals", brand: "Bata", category: "footwear", price: 1799, colorFamily: "tan", formalityLevel: 2, seasonTags: ["summer", "spring"], occasionTags: ["casual", "travel", "beach"], variants: shoeVariants },
  { name: "Canvas Slip-On Sneakers", brand: "H&M", category: "footwear", price: 1599, colorFamily: "white", formalityLevel: 2, seasonTags: ["summer", "spring"], occasionTags: ["casual", "travel"], variants: shoeVariants },
  { name: "Straw Fedora Hat", brand: "Zara", category: "accessory", price: 899, colorFamily: "beige", formalityLevel: 2, seasonTags: ["summer"], occasionTags: ["beach", "travel"], variants: oneSize },
  { name: "Tortoise Sunglasses", brand: "Ray-Ban", category: "accessory", price: 3499, colorFamily: "brown", formalityLevel: 2, seasonTags: ["summer", "spring"], occasionTags: ["casual", "travel", "beach"], variants: oneSize },
  { name: "Wool Blend Overcoat", brand: "Zara", category: "outerwear", price: 6999, colorFamily: "charcoal", formalityLevel: 4, seasonTags: ["winter"], occasionTags: ["formal", "work"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1520975954732-57dd22299614?auto=format&fit=crop&w=600&q=80"] },
  { name: "Merino Turtleneck Sweater", brand: "Uniqlo", category: "top", price: 2999, colorFamily: "black", formalityLevel: 3, seasonTags: ["winter"], occasionTags: ["formal", "work", "casual"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80"] },
  { name: "Tailored Wool Trousers", brand: "Zara", category: "bottom", price: 3499, colorFamily: "charcoal", formalityLevel: 4, seasonTags: ["winter", "fall"], occasionTags: ["formal", "work"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1594834749740-74b3f65fa4bd?auto=format&fit=crop&w=600&q=80"] },
  { name: "Leather Chelsea Boots", brand: "Clarks", category: "footwear", price: 5999, colorFamily: "black", formalityLevel: 4, seasonTags: ["winter", "fall"], occasionTags: ["formal", "work"], variants: shoeVariants },
  { name: "Cashmere Scarf", brand: "H&M", category: "accessory", price: 1999, colorFamily: "grey", formalityLevel: 3, seasonTags: ["winter"], occasionTags: ["formal", "work", "casual"], variants: oneSize },
  { name: "Denim Jacket", brand: "Levi's", category: "outerwear", price: 3999, colorFamily: "blue", formalityLevel: 2, seasonTags: ["fall", "spring"], occasionTags: ["casual"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=600&q=80"] },
  { name: "Flannel Check Shirt", brand: "H&M", category: "top", price: 1799, colorFamily: "red", formalityLevel: 2, seasonTags: ["fall"], occasionTags: ["casual"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=600&q=80"] },
  { name: "Straight Fit Jeans", brand: "Levi's", category: "bottom", price: 2999, colorFamily: "blue", formalityLevel: 2, seasonTags: ["fall", "spring", "winter"], occasionTags: ["casual"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80"] },
  { name: "Suede Desert Boots", brand: "Clarks", category: "footwear", price: 4499, colorFamily: "tan", formalityLevel: 3, seasonTags: ["fall", "spring"], occasionTags: ["casual", "work"], variants: shoeVariants },
  { name: "Silk Button-Up Shirt", brand: "Zara", category: "top", price: 2999, colorFamily: "black", formalityLevel: 4, seasonTags: ["summer", "spring", "fall"], occasionTags: ["party", "formal"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ce3?auto=format&fit=crop&w=600&q=80"] },
  { name: "Slim Fit Black Trousers", brand: "H&M", category: "bottom", price: 2499, colorFamily: "black", formalityLevel: 4, seasonTags: ["summer", "spring", "fall", "winter"], occasionTags: ["party", "formal"], variants: clothingVariants, images: ["https://images.unsplash.com/photo-1594834749740-74b3f65fa4bd?auto=format&fit=crop&w=600&q=80"] },
  { name: "Patent Leather Loafers", brand: "Clarks", category: "footwear", price: 4999, colorFamily: "black", formalityLevel: 4, seasonTags: ["summer", "spring", "fall", "winter"], occasionTags: ["party", "formal"], variants: shoeVariants },
  { name: "Minimalist Chain Necklace", brand: "H&M", category: "accessory", price: 799, colorFamily: "gold", formalityLevel: 3, seasonTags: ["summer", "spring", "fall", "winter"], occasionTags: ["party", "casual"], variants: oneSize },
];


async function seed() {
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany(products);
  logger.info(`Seeded ${products.length} products`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`);
  process.exit(1);
});
