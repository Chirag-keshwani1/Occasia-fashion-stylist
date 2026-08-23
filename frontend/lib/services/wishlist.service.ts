import { apiClient as api } from '../api/axios';
import { Product } from '@/types/product';

export interface WishlistResponse {
  _id: string;
  userId: string;
  products: Product[];
}

export const wishlistService = {
  getWishlist: async () => {
    return api.get<{ data: { wishlist: WishlistResponse } }>('/wishlist');
  },

  addToWishlist: async (productId: string) => {
    return api.post<{ data: { wishlist: WishlistResponse } }>(`/wishlist/${productId}`);
  },

  removeFromWishlist: async (productId: string) => {
    return api.delete<{ data: { wishlist: WishlistResponse } }>(`/wishlist/${productId}`);
  },
};
