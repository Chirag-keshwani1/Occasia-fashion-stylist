'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/product';
import { APP_CONFIG } from '@/lib/constants/config';
import { Button } from '@/components/ui/button';
import { Heart, ExternalLink, Star, Search } from 'lucide-react';
import { toast } from 'sonner';
import { VirtualTryOnModal } from './VirtualTryOnModal';
import { analyticsService } from '@/lib/services/analytics.service';

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  // eslint-disable-next-line react-hooks/purity
  const isNew = new Date(product.createdAt) > new Date(Date.now() - APP_CONFIG.PRODUCT.NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000);

  const [selectedSize, setSelectedSize] = React.useState<string | null>(
    product.variants.find(v => v.stock > 0)?.size || null
  );

  const handleWishlist = () => {
    toast.info('Wishlist functionality will be integrated soon.');
  };

  const handleRetailerClick = () => {
    analyticsService.trackOutboundClick(product);
  };

  const getFallbackUrl = () => {
    const queryParams = new URLSearchParams();
    if (product.category) queryParams.append('category', product.category);
    if (product.gender) queryParams.append('gender', product.gender);
    if (product.styleTags && product.styleTags.length > 0) queryParams.append('style', product.styleTags[0]);
    if (product.seasonTags && product.seasonTags.length > 0) queryParams.append('season', product.seasonTags[0]);
    return `/shop?${queryParams.toString()}`;
  };

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          {product.brand}
        </span>
        
        {/* Badges */}
        {product.totalStock === 0 ? (
          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
            {APP_CONFIG.UI.OUT_OF_STOCK}
          </span>
        ) : product.totalStock < APP_CONFIG.PRODUCT.LOW_STOCK_THRESHOLD ? (
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
            {APP_CONFIG.UI.LOW_STOCK}
          </span>
        ) : (
          <span className="bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
            {APP_CONFIG.UI.IN_STOCK}
          </span>
        )}

        {isNew && (
          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
            New
          </span>
        )}
      </div>

      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
        {product.name}
      </h1>

      <div className="flex items-center gap-4 mb-6">
        <div className="text-2xl font-bold">
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency || 'INR' }).format(product.price || 0)}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground border-l pl-4">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="font-medium text-foreground">{product.averageRating.toFixed(1)}</span>
          <span>({product.reviewCount} {APP_CONFIG.UI.REVIEWS})</span>
        </div>
      </div>

      <p className="text-muted-foreground text-base leading-relaxed mb-8">
        {product.description}
      </p>

      {/* Size Selection */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Select Size</span>
          <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Size Guide
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {product.variants.map((variant) => {
            const isAvailable = variant.stock > 0;
            const isSelected = selectedSize === variant.size;
            return (
              <button
                key={variant.size}
                onClick={() => isAvailable && setSelectedSize(variant.size)}
                disabled={!isAvailable}
                className={`
                  h-12 min-w-[3rem] px-4 rounded-xl border flex items-center justify-center text-sm font-medium transition-all
                  ${isSelected ? 'border-primary bg-primary text-primary-foreground' : ''}
                  ${!isSelected && isAvailable ? 'hover:border-foreground/50 border-input bg-background text-foreground' : ''}
                  ${!isAvailable ? 'opacity-40 cursor-not-allowed bg-muted border-dashed decoration-dashed' : ''}
                `}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {product.externalUrl ? (
          <a 
            href={product.externalUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex-1"
            onClick={handleRetailerClick}
          >
            <Button 
              size="lg" 
              className="w-full rounded-full h-14 text-base gap-2"
            >
              {APP_CONFIG.UI.SHOP_PRODUCT_CTA} <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </a>
        ) : (
          <Link href={getFallbackUrl()} className="flex-1">
            <Button 
              size="lg" 
              variant="secondary"
              className="w-full rounded-full h-14 text-base gap-2"
            >
              Explore Similar Products <Search className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
        <Button 
          size="lg" 
          variant="outline" 
          className="rounded-full h-14 px-8 gap-2"
          onClick={handleWishlist}
        >
          <Heart className="h-5 w-5" />
        </Button>
      </div>

      <div className="mb-8">
        <VirtualTryOnModal productId={product._id} category={product.category} />
      </div>
      
      <div className="border-t pt-6 text-sm text-muted-foreground space-y-2">
        <p><span className="font-medium text-foreground">Category:</span> <span className="capitalize">{product.category}</span></p>
        <p><span className="font-medium text-foreground">Gender:</span> <span className="capitalize">{product.gender}</span></p>
      </div>
    </div>
  );
}
