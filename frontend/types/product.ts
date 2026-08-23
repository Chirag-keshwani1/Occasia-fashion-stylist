export interface ProductVariant {
  size: string;
  stock: number;
}

export interface Product {
  _id: string;
  name: string;
  brand: string;
  description: string;
  category: 'top' | 'bottom' | 'footwear' | 'accessory' | 'outerwear';
  price: number;
  currency: string;
  images: string[];
  variants: ProductVariant[];
  seasonTags: ('summer' | 'winter' | 'fall' | 'spring')[];
  occasionTags: ('casual' | 'formal' | 'beach' | 'travel' | 'party' | 'work')[];
  colorFamily: string;
  formalityLevel: number;
  gender: 'men' | 'women' | 'unisex';
  styleTags: string[];
  averageRating: number;
  reviewCount: number;
  externalUrl?: string | null;
  isActive: boolean;
  totalStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export interface Review {
  _id: string;
  productId: string;
  userId: { _id: string; name: string } | string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReviewsResponse {
  reviews: Review[];
  pagination: Pagination;
}

export interface ProductQueryFilters {
  season?: string;
  occasion?: string;
  category?: string;
  gender?: string;
  style?: string;
  color?: string;
  brand?: string;
  formality?: number;
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
  page?: number;
  limit?: number;
}
