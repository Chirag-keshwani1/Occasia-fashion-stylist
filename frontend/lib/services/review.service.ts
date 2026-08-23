import { apiClient } from '../api/axios';
import { PaginatedReviewsResponse, Review } from '@/types/product';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const reviewService = {
  getProductReviews: async (productId: string, page = 1, limit = 10, sort: 'newest' | 'highest' | 'lowest' = 'newest'): Promise<ApiResponse<PaginatedReviewsResponse>> => {
    const response = await apiClient.get(`/reviews/${productId}`, { params: { page, limit, sort } });
    return response.data;
  },

  createReview: async (productId: string, reviewData: { rating: number; title?: string; body?: string }): Promise<ApiResponse<{ review: Review }>> => {
    const response = await apiClient.post(`/reviews/${productId}`, reviewData);
    return response.data;
  },
};
