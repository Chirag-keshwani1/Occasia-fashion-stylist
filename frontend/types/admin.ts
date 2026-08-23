import { Product } from './product';
import { Order } from './order';

export interface OverviewStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueGrowth: number;
  orderGrowth: number;
  userGrowth: number;
}

export interface RevenueNode {
  _id: string; // Date string
  revenue: number;
  orders: number;
}

export interface TopProduct extends Product {
  totalSold: number;
  revenue: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  orderCount?: number;
  totalSpent?: number;
}

export interface PaginatedUsers {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedOrders {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateProductDTO {
  name: string;
  brand: string;
  description?: string;
  category: string;
  price: number;
  currency?: string;
  images?: string[];
  variants: {
    size: string;
    stock: number;
  }[];
  seasonTags: string[];
  occasionTags: string[];
  colorFamily: string;
  formalityLevel?: number;
  gender?: string;
  styleTags?: string[];
  externalUrl?: string | null;
}

export type UpdateProductDTO = Partial<CreateProductDTO>;

export interface UpdateStockDTO {
  variantId: string;
  stock: number;
}

export interface UpdateOrderStatusDTO {
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}
