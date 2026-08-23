import { apiClient } from '../api/axios';
import { Order, ShippingAddress } from '@/types/order';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const orderService = {
  checkout: async (
    idempotencyKey: string,
    data: { couponCode?: string | null; shippingAddress: ShippingAddress }
  ): Promise<ApiResponse<{ order: Order }>> => {
    const response = await apiClient.post('/orders/checkout', data, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      }
    });
    return response.data;
  },

  validateCoupon: async (code: string, cartTotal: number): Promise<ApiResponse<{ coupon: { code: string; discount: number; type: string }; finalTotal: number }>> => {
    const response = await apiClient.post('/coupons/validate', { code, cartTotal });
    return response.data;
  },

  getMyOrderById: async (orderId: string): Promise<ApiResponse<{ order: Order }>> => {
    const response = await apiClient.get(`/orders/mine/${orderId}`);
    return response.data;
  }
};
