/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '../api/axios';
import { Product, PaginatedProductsResponse } from '@/types/product';
import { 
  OverviewStats, 
  RevenueNode, 
  TopProduct, 
  PaginatedUsers, 
  PaginatedOrders,
  CreateProductDTO,
  UpdateProductDTO,
  UpdateStockDTO,
  UpdateOrderStatusDTO
} from '@/types/admin';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const adminService = {
  // Analytics
  getOverview: async (): Promise<ApiResponse<OverviewStats>> => {
    const response = await apiClient.get('/admin/analytics/overview');
    return response.data;
  },
  
  getRevenueSeries: async (period: 'day' | 'week' | 'month' = 'day', limit = 30): Promise<ApiResponse<{ series: RevenueNode[], period: string }>> => {
    const response = await apiClient.get('/admin/analytics/revenue', { params: { period, limit } });
    return response.data;
  },

  getTopProducts: async (limit = 10): Promise<ApiResponse<{ products: TopProduct[] }>> => {
    const response = await apiClient.get('/admin/analytics/top-products', { params: { limit } });
    return response.data;
  },

  getLowStockProducts: async (threshold = 10, limit = 20): Promise<ApiResponse<{ products: Product[], threshold: number }>> => {
    const response = await apiClient.get('/admin/analytics/low-stock', { params: { threshold, limit } });
    return response.data;
  },

  // Users
  getUsers: async (page = 1, limit = 20, search?: string): Promise<ApiResponse<PaginatedUsers>> => {
    const response = await apiClient.get('/admin/users', { params: { page, limit, search } });
    return response.data;
  },

  // Products
  getProducts: async (params: Record<string, any>): Promise<ApiResponse<PaginatedProductsResponse>> => {
    const response = await apiClient.get('/admin/products', { params });
    return response.data;
  },

  getProduct: async (id: string): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.get(`/admin/products/${id}`);
    return response.data;
  },

  createProduct: async (data: CreateProductDTO): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.post('/admin/products', data);
    return response.data;
  },

  updateProduct: async (id: string, data: UpdateProductDTO): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.put(`/admin/products/${id}`, data);
    return response.data;
  },

  updateStock: async (id: string, data: UpdateStockDTO): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.patch(`/admin/products/${id}/stock`, data);
    return response.data;
  },

  activateProduct: async (id: string): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.patch(`/admin/products/${id}/activate`);
    return response.data;
  },

  deactivateProduct: async (id: string): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.patch(`/admin/products/${id}/deactivate`);
    return response.data;
  },

  uploadImages: async (id: string, formData: FormData): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.post(`/admin/products/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteImage: async (id: string, imageUrl: string): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.delete(`/admin/products/${id}/images`, { data: { imageUrl } });
    return response.data;
  },

  // Orders
  getOrders: async (params: Record<string, any>): Promise<ApiResponse<PaginatedOrders>> => {
    const response = await apiClient.get('/admin/orders', { params });
    return response.data;
  },

  updateOrderStatus: async (id: string, data: UpdateOrderStatusDTO): Promise<ApiResponse<{ order: any }>> => {
    const response = await apiClient.patch(`/admin/orders/${id}/status`, data);
    return response.data;
  },

  // Coupons
  getCoupons: async (): Promise<ApiResponse<{ coupons: any[] }>> => {
    const response = await apiClient.get('/admin/coupons');
    return response.data;
  },

  createCoupon: async (data: any): Promise<ApiResponse<{ coupon: any }>> => {
    const response = await apiClient.post('/admin/coupons', data);
    return response.data;
  },

  deactivateCoupon: async (id: string): Promise<ApiResponse<{ coupon: any }>> => {
    const response = await apiClient.patch(`/admin/coupons/${id}/deactivate`);
    return response.data;
  }
};
