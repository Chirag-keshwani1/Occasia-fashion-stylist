const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

async function verifyCheckout() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-fashion');
    console.log('Connected to DB');

    // Find an admin or any user to act as our test user
    const userModel = User.default || User;
    const orderModel = Order.default || Order;
    const productModel = Product.default || Product;
    const user = await userModel.findOne({ email: 'admin@example.com' }) || await userModel.findOne();
    if (!user) {
      console.log('No user found');
      return;
    }

    // Add a non-default address to the user's address book
    const nonDefaultAddress = {
      fullName: 'Test User Non-Default',
      line1: '456 Secondary St',
      city: 'Other City',
      state: 'Other State',
      postalCode: '67890',
      country: 'India',
      phone: '9876543210',
      isDefault: false
    };

    user.addresses.push(nonDefaultAddress);
    await user.save();
    
    // Get the newly added address ID
    const addedAddress = user.addresses[user.addresses.length - 1];
    console.log('Added non-default address with ID:', addedAddress._id);

    // Find a product for the order
    const product = await productModel.findOne();
    if (!product) {
      console.log('No product found');
      return;
    }

    // Create an order using this non-default address
    const orderData = {
      userId: user._id,
      items: [{
        productId: product._id,
        qty: 1,
        priceAtOrder: product.price,
        size: 'M',
      }],
      shippingAddress: {
        fullName: addedAddress.fullName,
        line1: addedAddress.line1,
        city: addedAddress.city,
        state: addedAddress.state,
        postalCode: addedAddress.postalCode,
        country: addedAddress.country,
        phone: addedAddress.phone,
      },
      subtotal: product.price,
      total: product.price,
    };

    const order = await orderModel.create(orderData);
    console.log('Created order with non-default address. Order ID:', order._id);

    // Verify it in the DB
    const verifiedOrder = await orderModel.findById(order._id);
    console.log('Verified Order Shipping Address:');
    console.log(verifiedOrder.shippingAddress);

    if (verifiedOrder.shippingAddress.street === '456 Secondary St') {
      console.log('SUCCESS: Order correctly saved with non-default address in MongoDB.');
    } else {
      console.log('FAILURE: Address mismatch.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyCheckout();
