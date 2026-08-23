'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService, recommendationService } from '@/lib/services/product.service';
import { ProductCarousel } from '@/components/cards/ProductCarousel';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';

export function PersonalizedRecommendations() {
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
    enabled: isAuthenticated,
  });

  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-16"
        >
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Discover across brands.
          </h2>
          <p className="text-lg text-muted-foreground">
            We aggregate the best pieces from premium retailers. See what&apos;s trending, or let our AI curate specifically for your taste.
          </p>
        </motion.div>

        <div className="flex flex-col gap-16 w-full">
          {isAuthenticated && personalizedData?.data?.products?.length ? (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <ProductCarousel 
                title="Curated For You" 
                products={personalizedData.data.products} 
                isLoading={isLoadingPersonalized} 
              />
            </motion.div>
          ) : null}

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <ProductCarousel 
              title="Trending Now" 
              products={trendingData?.data?.products || []} 
              isLoading={isLoadingTrending} 
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <ProductCarousel 
              title="New Arrivals" 
              products={newArrivalsData?.data?.products || []} 
              isLoading={isLoadingNewArrivals} 
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
