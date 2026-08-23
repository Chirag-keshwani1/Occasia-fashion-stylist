'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const { wishlistProductIds, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const isWishlisted = wishlistProductIds.has(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    toggleWishlist.mutate({ productId, isWishlisted });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full bg-background/80 backdrop-blur-sm hover:bg-background h-8 w-8 shadow-sm transition-all",
        isWishlisted ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={handleClick}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
    </Button>
  );
}
