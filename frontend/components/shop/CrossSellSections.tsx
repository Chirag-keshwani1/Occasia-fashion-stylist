'use client';

import React from 'react';
import { useQueries } from '@tanstack/react-query';
import { recommendationService } from '@/lib/services/product.service';
import { ProductCarousel } from '@/components/cards/ProductCarousel';
import { APP_CONFIG } from '@/lib/constants/config';
import { Product } from '@/types/product';

interface CrossSellSectionsProps {
  productId: string;
}

export function CrossSellSections({ productId }: CrossSellSectionsProps) {
  // Fetch all cross-sell data concurrently
  const results = useQueries({
    queries: [
      {
        queryKey: ['cross-sell', 'similar', productId],
        queryFn: () => recommendationService.getSimilar(productId, 8),
      },
      {
        queryKey: ['cross-sell', 'complete-the-look', productId],
        queryFn: () => recommendationService.getCompleteTheLook(productId, 8),
      },
      {
        queryKey: ['cross-sell', 'frequently-bought-together', productId],
        queryFn: () => recommendationService.getFrequentlyBoughtTogether(productId, 8),
      },
      {
        queryKey: ['cross-sell', 'more-from-brand', productId],
        queryFn: () => recommendationService.getMoreFromBrand(productId, 8),
      },
      {
        queryKey: ['cross-sell', 'customers-also-viewed', productId],
        queryFn: () => recommendationService.getCustomersAlsoViewed(productId, 8),
      }
    ]
  });

  const [
    similar,
    completeTheLook,
    boughtTogether,
    moreFromBrand,
    alsoViewed
  ] = results;

  const sections = [
    { title: APP_CONFIG.UI.COMPLETE_THE_LOOK, data: completeTheLook },
    { title: APP_CONFIG.UI.FREQUENTLY_BOUGHT_TOGETHER, data: boughtTogether },
    { title: APP_CONFIG.UI.SIMILAR_PRODUCTS, data: similar },
    { title: APP_CONFIG.UI.CUSTOMERS_ALSO_VIEWED, data: alsoViewed },
    { title: APP_CONFIG.UI.MORE_FROM_BRAND, data: moreFromBrand },
  ];

  return (
    <div className="flex flex-col gap-16 py-8">
      {sections.map((section, idx) => {
        const products: Product[] = section.data.data?.data?.products || [];
        const isLoading = section.data.isLoading;
        const isError = section.data.isError;

        // Skip rendering the section entirely if there are no products (unless it's loading)
        if (!isLoading && !isError && products.length === 0) {
          return null;
        }

        return (
          <div key={idx} className="w-full">
            <ProductCarousel 
              title={section.title}
              products={products}
              isLoading={isLoading}
            />
          </div>
        );
      })}
    </div>
  );
}
