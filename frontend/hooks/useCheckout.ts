import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/lib/services/order.service';
import { ShippingAddress } from '@/types/order';
import { toast } from 'sonner';
import { CART_QUERY_KEY } from './useCart';

export function useCheckout() {
  const queryClient = useQueryClient();

  const validateCoupon = useMutation({
    mutationFn: ({ code, cartTotal }: { code: string; cartTotal: number }) => 
      orderService.validateCoupon(code, cartTotal),
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Invalid coupon');
    }
  });

  const placeOrder = useMutation({
    mutationFn: ({ 
      idempotencyKey, 
      data 
    }: { 
      idempotencyKey: string; 
      data: { couponCode?: string | null; shippingAddress: ShippingAddress } 
    }) => orderService.checkout(idempotencyKey, data),
    onSuccess: () => {
      // Clear the cart cache as it has been converted to an order
      queryClient.setQueryData(CART_QUERY_KEY, { data: { items: [], subtotal: 0 } });
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Checkout failed. Please try again.');
    }
  });

  return {
    validateCoupon,
    placeOrder
  };
}
