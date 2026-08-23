'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { Product } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductCarouselProps {
  title: string;
  products: Product[];
  isLoading?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function ProductCarousel({ 
  title, 
  products, 
  isLoading = false, 
  className,
  emptyMessage = "No products found."
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth, scrollLeft } = scrollRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!isLoading && products.length === 0) {
    return (
      <section className={cn("w-full py-8", className)}>
        <div className="flex items-center justify-between mb-6 px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
        </div>
        <div className="px-4 md:px-8 text-muted-foreground">{emptyMessage}</div>
      </section>
    );
  }

  return (
    <section className={cn("w-full py-8", className)}>
      <div className="flex items-center justify-between mb-6 px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-9 w-9 hidden sm:flex"
            onClick={() => scroll('left')}
            disabled={isLoading}
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Scroll left</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-9 w-9 hidden sm:flex"
            onClick={() => scroll('right')}
            disabled={isLoading}
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Scroll right</span>
          </Button>
        </div>
      </div>

      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 px-4 md:px-8 pb-8 pt-2 snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="min-w-[240px] md:min-w-[280px] snap-start flex-none">
                  <ProductCardSkeleton />
                </div>
              ))
            : products.map((product) => (
                <div key={product._id} className="min-w-[240px] md:min-w-[280px] snap-start flex-none">
                  <ProductCard product={product} />
                </div>
              ))
          }
        </div>
      </div>
    </section>
  );
}
