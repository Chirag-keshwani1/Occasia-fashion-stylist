'use client';

import { useQuery } from '@tanstack/react-query';
import { productService, recommendationService } from '@/lib/services/product.service';
import { ProductCarousel } from '@/components/cards/ProductCarousel';
import { useAuthStore } from '@/store/useAuthStore';

export function HomeProductSections() {
  const { isAuthenticated } = useAuthStore();

  const { data: trendingData, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn: () => recommendationService.getTrending(8),
  });

  const { data: newArrivalsData, isLoading: isLoadingNewArrivals } = useQuery({
    queryKey: ['products', 'newArrivals'],
    queryFn: () => productService.getNewArrivals(1, 8),
  });

  const { data: personalizedData, isLoading: isLoadingPersonalized } = useQuery({
    queryKey: ['products', 'personalized'],
    queryFn: () => recommendationService.getPersonalized(8),
    enabled: isAuthenticated, // Only fetch if user is logged in
  });

  return (
    <div className="flex flex-col gap-8 py-8 w-full">
      <ProductCarousel 
        title="Trending Now" 
        products={trendingData?.data?.products || []} 
        isLoading={isLoadingTrending} 
      />

      {isAuthenticated && (
        <ProductCarousel 
          title="Recommended For You" 
          products={personalizedData?.data?.products || []} 
          isLoading={isLoadingPersonalized} 
        />
      )}

      <ProductCarousel 
        title="New Arrivals" 
        products={newArrivalsData?.data?.products || []} 
        isLoading={isLoadingNewArrivals} 
      />
    </div>
  );
}
