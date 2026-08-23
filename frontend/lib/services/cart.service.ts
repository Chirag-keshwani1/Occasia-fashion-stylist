import { apiClient } from '../api/axios';
import { Cart } from '@/types/cart';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const cartService = {
  getCart: async (): Promise<ApiResponse<Cart>> => {
    const response = await apiClient.get('/cart');
    return response.data;
  },

  addItem: async (productId: string, size: string, qty: number): Promise<ApiResponse<Cart>> => {
    const response = await apiClient.post('/cart', { productId, size, qty });
    return response.data;
  },

  updateItemQty: async (productId: string, size: string, qty: number): Promise<ApiResponse<Cart>> => {
    const response = await apiClient.patch(`/cart/${productId}/${size}`, { qty });
    return response.data;
  },

  removeItem: async (productId: string, size: string): Promise<ApiResponse<Cart>> => {
    const response = await apiClient.delete(`/cart/${productId}/${size}`);
    return response.data;
  }
};
