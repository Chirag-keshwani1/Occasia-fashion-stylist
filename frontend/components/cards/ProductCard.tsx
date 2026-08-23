import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/lib/constants/config';
import { useQuickViewStore } from '@/store/useQuickViewStore';
import { WishlistButton } from '@/components/shared/WishlistButton';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fallbackImage = '/placeholder.svg';
  
  const primaryImage = product.images?.[0] || fallbackImage;
  const secondaryImage = product.images?.[1] || primaryImage;
  const displayImage = isHovered ? secondaryImage : primaryImage;

  // eslint-disable-next-line react-hooks/purity
  const isNew = new Date(product.createdAt) > new Date(Date.now() - APP_CONFIG.PRODUCT.NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000);

  return (
    <motion.div 
      className="group relative flex flex-col gap-3 rounded-2xl p-3 hover:bg-muted/50 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
          {product.totalStock === 0 ? (
            <span className="bg-destructive/90 text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-md">
              Out of Stock
            </span>
          ) : product.totalStock < APP_CONFIG.PRODUCT.LOW_STOCK_THRESHOLD ? (
            <span className="bg-orange-500/90 text-white text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-md">
              Low Stock
            </span>
          ) : null}
          {/* New badge based on createdAt */}
          {isNew && (
            <span className="bg-primary/90 text-primary-foreground text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-md w-fit">
              New
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <WishlistButton productId={product._id} />
        </div>

        {/* Quick View Button */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button 
            className="w-full bg-background/90 text-foreground backdrop-blur-md hover:bg-background shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              useQuickViewStore.getState().open(product);
            }}
          >
            Quick View
          </Button>
        </div>

        {/* Image */}
        <Link href={`/product/${product._id}`} className="block h-full w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={displayImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <Image
                src={imageError ? fallbackImage : displayImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            </motion.div>
          </AnimatePresence>
        </Link>
      </div>

      <Link href={`/product/${product._id}`} className="flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider truncate">
            {product.brand}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}</span>
          </div>
        </div>
        <h2 className="font-semibold leading-tight line-clamp-1">{product.name}</h2>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-bold">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency || 'INR' }).format(product.price || 0)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
