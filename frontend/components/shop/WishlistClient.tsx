'use client';

import React from 'react';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductCard } from '@/components/cards/ProductCard';
import { Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Product } from '@/types/product';

export function WishlistClient() {
  const { wishlist, isLoading } = useWishlist();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Heart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
        <p className="text-muted-foreground mb-8">Save items you love to build your perfect wardrobe.</p>
        <Link href="/shop">
          <Button size="lg" className="rounded-full px-8">Discover Styles</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {wishlist.map((product: Product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
