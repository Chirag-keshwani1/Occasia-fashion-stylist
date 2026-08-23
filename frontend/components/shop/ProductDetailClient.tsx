'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/lib/services/product.service';
import { ErrorState } from '@/components/ui/error-state';
import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';
import { ProductReviews } from './ProductReviews';
import { CrossSellSections } from './CrossSellSections';
import { APP_CONFIG } from '@/lib/constants/config';
import { Loader2 } from 'lucide-react';

interface ProductDetailClientProps {
  productId: string;
}

export function ProductDetailClient({ productId }: ProductDetailClientProps) {
  // Fetch main product details
  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProduct(productId),
  });

  if (isError) {
    return (
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !response?.data?.product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{APP_CONFIG.UI.LOADING_MESSAGE}</p>
      </div>
    );
  }

  const product = response.data.product;

  return (
    <div className="flex flex-col max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 gap-16">
      
      {/* Top Section: Gallery & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <ProductGallery images={product.images || []} productName={product.name} />
        <ProductInfo product={product} />
      </div>

      {/* AI Features Reserved Section (Phase 3) */}
      <div className="flex flex-col gap-8 py-8 border-y border-border/50 bg-muted/20 rounded-3xl px-6 md:px-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Styling & AI Pairings</h2>
          <p className="text-muted-foreground">
            {/* Minimal placeholder indicating structural readiness for Phase 3 */}
            Advanced AI capabilities will be integrated here in Phase 3.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI Style Tips Placeholder */}
          <div className="border border-dashed border-border rounded-2xl p-8 flex items-center justify-center min-h-[200px] bg-background">
            <span className="text-muted-foreground font-medium">{APP_CONFIG.UI.AI_STYLE_TIPS_PLACEHOLDER}</span>
          </div>

          {/* AI Outfit Pairings Placeholder */}
          <div className="border border-dashed border-border rounded-2xl p-8 flex items-center justify-center min-h-[200px] bg-background">
            <span className="text-muted-foreground font-medium">{APP_CONFIG.UI.AI_OUTFIT_PAIRINGS_PLACEHOLDER}</span>
          </div>
        </div>
      </div>

      {/* Cross-Selling Sections (Parallel data fetching handled inside) */}
      <CrossSellSections productId={productId} />

      {/* Reviews Section */}
      <ProductReviews productId={productId} />

    </div>
  );
}
