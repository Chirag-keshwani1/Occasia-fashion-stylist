import { apiClient } from '../api/axios';
import { 
  Product, 
  PaginatedProductsResponse, 
  ProductQueryFilters 
} from '@/types/product';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const productService = {
  getProducts: async (filters: ProductQueryFilters = {}): Promise<ApiResponse<PaginatedProductsResponse>> => {
    const response = await apiClient.get('/products', { params: filters });
    return response.data;
  },

  getNewArrivals: async (page = 1, limit = 12): Promise<ApiResponse<PaginatedProductsResponse>> => {
    const response = await apiClient.get('/products/new-arrivals', { params: { page, limit } });
    return response.data;
  },

  getProduct: async (id: string): Promise<ApiResponse<{ product: Product }>> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
};

export const recommendationService = {
  getPersonalized: async (limit = 12): Promise<ApiResponse<{ products: Product[] }>> => {
    const response = await apiClient.get('/recommendations/personalized', { params: { limit } });
    return response.data;
  },

  getTrending: async (limit = 12): Promise<ApiResponse<{ products: Product[] }>> => {
    const response = await apiClient.get('/recommendations/trending', { params: { limit } });
    return response.data;
  },

  getSimilar: async (productId: string, limit = 8): Promise<ApiResponse<{ products: Product[] }>> => {
    const response = await apiClient.get(`/products/${productId}/similar`, { params: { limit } });
    return response.data;
  },

  getCompleteTheLook: async (productId: string, limit = 8): Promise<ApiResponse<{ products: Product[] }>> => {
    const response = await apiClient.get(`/products/${productId}/complete-the-look`, { params: { limit } });
    return response.data;
  },

  getFrequentlyBoughtTogether: async (productId: string, limit = 6): Promise<ApiResponse<{ products: Product[] }>> => {
    const response = await apiClient.get(`/products/${productId}/frequently-bought-together`, { params: { limit } });
    return response.data;
  },

  getMoreFromBrand: async (productId: string, limit = 8): Promise<ApiResponse<{ products: Product[] }>> => {
    const response = await apiClient.get(`/products/${productId}/more-from-brand`, { params: { limit } });
    return response.data;
  },

  getAlternatives: async (productId: string, type: 'budget' | 'premium', limit = 6): Promise<ApiResponse<{ products: Product[], type: string }>> => {
    const response = await apiClient.get(`/products/${productId}/alternatives`, { params: { type, limit } });
    return response.data;
  },

  getCustomersAlsoViewed: async (productId: string, limit = 8): Promise<ApiResponse<{ products: Product[] }>> => {
    const response = await apiClient.get(`/products/${productId}/customers-also-viewed`, { params: { limit } });
    return response.data;
  },
};
