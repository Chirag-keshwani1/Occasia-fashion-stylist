# Changelog

All notable changes to this project will be documented in this file.

## [Phase 6] - AI Fashion Discovery Landing Page Redesign
### Added
- Created a completely new premium, cinematic landing page architecture inspired by editorial fashion-tech platforms.
- Built scroll-triggered animations and storytelling sections using Framer Motion.
- Added modular landing components in `frontend/components/landing/`: `HeroSection.tsx`, `AiStylistDemo.tsx`, `OutfitGeneratorDemo.tsx`, `PersonalizedRecommendations.tsx`, `CompleteTheLookSection.tsx`, `SmartShoppingSection.tsx`, `VirtualTryOnSection.tsx`, `FinalCTA.tsx`, `VideoShowcase.tsx`.
- Updated `Navbar.tsx` to include a transparent-to-solid scroll transition effect for the homepage.
- Shifted the product strategy from a direct e-commerce checkout to an affiliate-style fashion discovery platform.
- Mapped external product links via the backend's `externalUrl` field.
- Integrated `posthog-js` for real frontend-only tracking of `outbound_retailer_click` events, ensuring minimum privacy impact (only domain tracked).
- Verified accessibility in `VirtualTryOnModal`: it correctly uses the `@base-ui/react` `render` pattern instead of Radix `asChild`.
- Improved UX for products missing an external retailer link by providing a transparent tag-based "Explore Similar Products" fallback.
- Fixed accessibility of background videos by respecting the `prefers-reduced-motion` media query.

### Changed
- Refactored `ProductInfo.tsx` and `ProductCard.tsx` to remove the "Add to Cart" functionality and replace it with "Shop on [Brand] ->" external links (where available).
- Replaced the primary checkout and shopping bag navigation with discovering and AI styling experiences.
- Removed `CartDrawer` from `app/layout.tsx` to disconnect internal purchasing.
- Fully rewrote `app/page.tsx` to orchestrate the new AI landing page components rather than traditional product carousels.

### Removed
- Removed Cart navigation button and cart store usage from the Navbar.
- Removed "Add to Cart" interactions from product flows in favor of external redirects.


## [Phase 5] - Admin Panel
### Added
- Built full Admin Layout with responsive sidebar and mobile sheet navigation.
- Implemented `DashboardMetrics` and `RevenueChart` with Recharts.
- Added paginated `ProductTable` with search and stock management capabilities.
- Created `ProductForm` using `react-hook-form` and `zod` for validation.
- Integrated Cloudinary multipart/form-data upload in `ImageUploader`.
- Built `OrderTable` allowing admins to manage and update order statuses.
- Built `UserTable` displaying user order counts and total spent.
- Added strict `ProtectedRoute` wrapping all admin routes, validating the 'admin' role.
### Fixed
- Standardized product variants and images typing across the application.
- Resolved all Next.js hydration issues and ESLint warnings.

## [Phase 4] - Shopping Cart & Checkout
### Added
- Integrated Cart persistence with the real backend via React Query.
- Added live cart count badge to Navbar using `framer-motion`.
- Implemented `CartDrawer.tsx` slide-over panel for quick cart interactions.
- Built a dedicated Checkout Page (`app/(shop)/checkout/page.tsx`).
- Added robust checkout form validation with local state.
- Integrated coupon validation endpoint for live subtotal recalculation.
- Created `OrderSuccessClient.tsx` for post-checkout order summary display.
- Implemented `cart.service.ts` and `order.service.ts` for full API communication.

### Changed
- Refactored `ProductInfo.tsx` to handle size selection required before Add to Cart.
- Added Suspense boundary to Checkout Success page to fix Next.js prerender error.

### Fixed
- Fixed cart state synchronization to ensure it's driven entirely by backend responses (no local-storage divergence).

## [Phase 3] - Product Detail Page
### Added
- Integrated dynamic `ProductGallery` with thumbnails, hover zoom, and error fallbacks.
- Integrated paginated `ProductReviews` with submission locked to authenticated users.
- Built `CrossSellSections.tsx` that intelligently hides carousels if the backend returns no recommendations.
- Wired Add to Cart size validation logic.
- Managed UI text centrally via `APP_CONFIG`.

## [Phase 2] - Product Listing & Home Page
### Added
- Built Home Page with trending and personalized recommendations.
- Built Product Listing Page with URL-based search params filtering.

## [Phase 1] - Architecture & Authentication
### Added
- Initialized Next.js App Router structure.
- Configured Axios interceptors and React Query.
- Setup global state management using Zustand.
- Created premium UI tokens and Tailwind CSS config.
