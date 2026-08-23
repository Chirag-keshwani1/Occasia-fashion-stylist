import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/lib/services/cart.service';
import { Cart } from '@/types/cart';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

export const CART_QUERY_KEY = ['cart'];

export function useCart() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 1. Fetch Cart
  const { data, isLoading, isError } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
  });

  const cart = data?.data || { items: [], subtotal: 0 };

  // 2. Add Item
  const addItem = useMutation({
    mutationFn: ({ productId, size, qty }: { productId: string; size: string; qty: number }) => 
      cartService.addItem(productId, size, qty),
    onSuccess: (response) => {
      queryClient.setQueryData(CART_QUERY_KEY, response);
      toast.success('Added to cart');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to add item');
    }
  });

  // 3. Update Quantity (Optimistic)
  const updateQty = useMutation({
    mutationFn: ({ productId, size, qty }: { productId: string; size: string; qty: number }) => 
      cartService.updateItemQty(productId, size, qty),
    onMutate: async ({ productId, size, qty }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousData = queryClient.getQueryData<{ data: Cart }>(CART_QUERY_KEY);
      
      // Optimistically update
      if (previousData) {
        queryClient.setQueryData(CART_QUERY_KEY, {
          ...previousData,
          data: {
            ...previousData.data,
            items: previousData.data.items.map(item => 
              (item.productId === productId && item.size === size) 
                ? { ...item, qty } 
                : item
            )
          }
        });
      }
      return { previousData };
    },
    onError: (error: unknown, variables, context) => {
      const err = error as { response?: { data?: { message?: string } } };
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousData);
      }
      toast.error(err?.response?.data?.message || 'Failed to update quantity');
    },
    onSettled: () => {
      // Always refetch to ensure true state
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    }
  });

  // 4. Remove Item (Optimistic)
  const removeItem = useMutation({
    mutationFn: ({ productId, size }: { productId: string; size: string }) => 
      cartService.removeItem(productId, size),
    onMutate: async ({ productId, size }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousData = queryClient.getQueryData<{ data: Cart }>(CART_QUERY_KEY);
      
      // Optimistically remove
      if (previousData) {
        queryClient.setQueryData(CART_QUERY_KEY, {
          ...previousData,
          data: {
            ...previousData.data,
            items: previousData.data.items.filter(item => 
              !(item.productId === productId && item.size === size)
            )
          }
        });
      }
      return { previousData };
    },
    onError: (error: unknown, variables, context) => {
      const err = error as { response?: { data?: { message?: string } } };
      if (context?.previousData) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousData);
      }
      toast.error(err?.response?.data?.message || 'Failed to remove item');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    }
  });

  const cartCount = cart.items.reduce((total, item) => total + item.qty, 0);

  return {
    cart,
    cartCount,
    isLoading,
    isError,
    addItem,
    updateQty,
    removeItem
  };
}
