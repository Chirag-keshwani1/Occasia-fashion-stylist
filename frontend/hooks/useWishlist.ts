import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '@/lib/services/wishlist.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

export function useWishlist() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.getWishlist(),
    enabled: isAuthenticated,
  });

  const wishlistProductIds = new Set(
    wishlistData?.data?.data?.wishlist?.products?.map((p: { _id: string }) => p._id) || []
  );

  const toggleWishlist = useMutation({
    mutationFn: async ({ productId, isWishlisted }: { productId: string; isWishlisted: boolean }) => {
      if (isWishlisted) {
        return wishlistService.removeFromWishlist(productId);
      } else {
        return wishlistService.addToWishlist(productId);
      }
    },
    onMutate: async ({ productId, isWishlisted }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });

      // Snapshot the previous value
      const previousWishlist = queryClient.getQueryData(['wishlist']);

      // Optimistically update to the new value
      queryClient.setQueryData(['wishlist'], (old: { data?: { data?: { wishlist?: { products?: { _id: string }[] } } } } | undefined) => {
        if (!old?.data?.data?.wishlist) return old;
        
        const currentProducts = old.data.data.wishlist.products || [];
        
        if (isWishlisted) {
          // Remove it
          return {
            ...old,
            data: {
              ...old.data,
              data: {
                ...old.data.data,
                wishlist: {
                  ...old.data.data.wishlist,
                  products: currentProducts.filter((p: { _id: string }) => p._id !== productId),
                }
              }
            }
          };
        } else {
          // Add it (we only need the _id for checking if it's wishlisted, though full object is better, 
          // we can just stick a dummy object with _id, since the actual fetch will happen soon)
          return {
            ...old,
            data: {
              ...old.data,
              data: {
                ...old.data.data,
                wishlist: {
                  ...old.data.data.wishlist,
                  products: [...currentProducts, { _id: productId }],
                }
              }
            }
          };
        }
      });

      return { previousWishlist };
    },
    onError: (err, variables, context) => {
      // Rollback
      queryClient.setQueryData(['wishlist'], context?.previousWishlist);
      toast.error('Failed to update wishlist. Please try again.');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  return {
    wishlist: wishlistData?.data?.data?.wishlist?.products || [],
    wishlistProductIds,
    isLoading,
    toggleWishlist,
  };
}
