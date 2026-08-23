# Occasia - AI Fashion Stylist

Occasia is a modern, premium e-commerce web application with a built-in AI-powered styling engine. It uses Next.js on the frontend and Express/MongoDB on the backend. The AI integration is powered by Groq, providing fast, accurate, and structured styling recommendations based on a real product catalog.

---

## 🏗 Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Shadcn UI
- **State Management**: Zustand (Auth, Cart, QuickView, CartDrawer)
- **Data Fetching**: React Query (@tanstack/react-query)
- **Animation**: Framer Motion

### Backend
- **Framework**: Node.js & Express.js
- **Database**: MongoDB with Mongoose
- **AI Integration**: Groq API SDK (llama3-70b-8192)
- **Validation**: Zod (Structured validation for both API inputs and LLM outputs)
- **Authentication**: JWT (JSON Web Tokens)
- **Uploads**: Cloudinary

---

## 📁 Folder Structure

### Frontend (`/frontend`)
```
frontend/
├── app/                  # Next.js App Router pages and layouts
│   ├── (admin)/          # Protected admin routes (Dashboard, Products, Orders, Coupons)
│   ├── (auth)/           # Authentication routes (Login, Register)
│   ├── (protected)/      # User routes (Profile, Wishlist, Chat)
│   ├── (shop)/           # Public e-commerce routes (Shop, Product Details, Checkout, Outfits)
│   └── globals.css       # Global Tailwind styles
├── components/           # Reusable React components
│   ├── admin/            # Admin-specific tables and forms
│   ├── cards/            # Product cards, Category cards
│   ├── forms/            # Reusable forms (Login, Register, Product)
│   ├── layout/           # Navbar, Footer
│   ├── shared/           # Common UI elements (WishlistButton, ChatFAB)
│   ├── shop/             # E-commerce components (CartDrawer, Checkout, ProductGallery)
│   └── ui/               # Shadcn UI primitives
├── hooks/                # Custom React hooks (useCart, useCheckout)
├── lib/                  # Utilities and Services
│   ├── constants/        # Configuration constants
│   ├── services/         # API client services (axios instances)
│   └── utils.ts          # Helper functions (Tailwind merge, etc.)
├── store/                # Zustand global state stores
└── types/                # TypeScript interfaces
```

### Backend (`/backend`)
```
backend/
├── config/               # Database and environment configurations
├── controllers/          # Request handlers for each route
├── middleware/           # Express middleware (auth, error handling, validation, rate limiting)
├── models/               # Mongoose schemas (User, Product, Order, Coupon, ChatSession, Outfit)
├── routes/               # Express route definitions
├── seed/                 # Database seeding scripts (seedProducts.js)
├── services/             # Core business logic (aiStylistService.js, groq.js)
├── tests/                # Jest test suites
├── .env.example          # Template for required environment variables
└── server.js             # Main application entry point
```

---

## 🗺️ API Route Map

The backend provides a comprehensive REST API. Swagger documentation is available locally at `http://localhost:5000/api-docs` when the server is running.

**Authentication (`/api/auth`)**
- `POST /register` - Create a new user
- `POST /login` - Authenticate user and get JWT
- `POST /logout` - Clear authentication cookie

**Users (`/api/users`)**
- `GET /me` - Get current user profile
- `PATCH /me` - Update profile and preferences
- `GET /addresses` - Get user addresses

**Products (`/api/products`)**
- `GET /` - Get products (supports filtering, sorting, pagination)
- `GET /new-arrivals` - Get latest products
- `GET /:id` - Get single product
- `POST /` - Create product (Admin)

**Orders & Checkout (`/api/orders`)**
- `POST /checkout` - Place a new order
- `GET /my-orders` - Get user's order history
- `PUT /:id/cancel` - Cancel order (restores stock)

**Coupons (`/api/coupons`)**
- `POST /validate` - Check if coupon is valid for cart
- `POST /` - Create new coupon (Admin)
- `GET /` - List coupons (Admin)

**AI & Outfits (`/api/outfits` & `/api/chat`)**
- `POST /api/outfits/parse-and-generate` - NLP generation (Text -> JSON -> Product Match)
- `POST /api/chat/sessions` - Create or continue an AI conversation
- `POST /api/outfits/:id/save` - Save an outfit to user profile

---

## 🚀 Deployment

### Primary Deployment (Vercel & Render)
This application is optimized for free-tier PaaS deployment:
- **Frontend (Vercel)**: Connect your GitHub repository to Vercel. Select the `frontend` directory as the Root Directory. Vercel automatically detects Next.js.
- **Backend (Render)**: Deploy as a Web Service on Render using the `backend` directory. The start command should be `npm start` (which maps to `node server.js`). 
- **Database (MongoDB Atlas)**: Use a free cluster on MongoDB Atlas and set the `MONGO_URI` environment variable.

*No Docker configuration is required for Render/Vercel deployments.*

### Local Reproducibility (Docker Compose)
Docker configurations are included for local portfolio demonstration, ensuring reproducibility without installing local dependencies.

1. Create `.env` files in both `/frontend` and `/backend` based on their `.env.example` templates.
2. Run `docker compose up --build -d` from the root directory.
3. The app will be available at:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000/api`

---

## 🧪 Testing

The backend includes a comprehensive test suite using Jest, Supertest, and MongoDB Memory Server. Run tests with `npm run test` inside the `/backend` directory.

### Test Coverage (45/45 Passing)
- **`auth.test.js`**: Registration (duplicate email rejection, weak password rejection), Login (valid/invalid credentials), Profile fetching.
- **`productSearch.test.js`**: Flexible dynamic filtering (gender, brand, style tags, price ranges), Rating-based sorting, New Arrivals endpoint.
- **`filters.test.js`**: Edge cases for query parameters (empty queries, `null`/`undefined`, invalid enums), AI Outfit filter matching.
- **`coupon.test.js`**: Flat and percentage discount math (including max caps), validation rules (expired, below min value, deactivated, usage limits).
- **`checkout.test.js`**: Coupon category restrictions, user allowlists, virtual stock calculation across sizes.
- **`orderCancellation.test.js`**: Stock restoration upon cancellation, prevention of double-cancellation, checkout idempotency (preventing duplicate charges on network retry).

---

## ⚠️ Known Limitations / Intentionally Deferred

In the interest of shipping a robust MVP, certain features were intentionally deferred or simplified:

1. **Payment Gateway**: Checkout bypasses Stripe/Razorpay and immediately creates a successful order. Real financial integration was deferred.
2. **Email Notifications**: Password resets and order confirmation emails are not sent. Mailer integration (e.g., SendGrid/Resend) is required for production.
3. **Advanced Rate Limiting**: Basic rate-limiting is implemented, but robust DDOS protection (like Cloudflare) or distributed Redis-based rate limiting is missing.
4. **Search Sub-system**: Product search uses MongoDB indexing. For a massive scale (millions of SKUs), a dedicated search engine like Algolia or Elasticsearch would provide better typo-tolerance and faceted search performance.
5. **Session Management**: JWTs are stored in HTTP-only cookies, but token revocation (logout from all devices) is not implemented via a token blacklist.
