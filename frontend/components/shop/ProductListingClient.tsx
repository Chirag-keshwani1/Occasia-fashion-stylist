'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productService } from '@/lib/services/product.service';
import { ProductCard } from '@/components/cards/ProductCard';
import { ProductCardSkeleton } from '@/components/cards/ProductCardSkeleton';
import { FilterSidebar } from './FilterSidebar';
import { QuickViewModal } from './QuickViewModal';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SORT_OPTIONS = [
  { label: 'Newest Arrivals', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Highest Rated', value: 'rating' },
];

export function ProductListingClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Search state (local state for input, debounced to URL)
  const initialSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(initialSearch);

  // Re-sync local search input if URL changes externally (e.g. back button)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  const updateUrlParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Always reset page to 1 when changing filters/search
    if (key !== 'page') params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only push to URL if it differs from what's already there
      const currentUrlSearch = searchParams.get('search') || '';
      if (searchInput !== currentUrlSearch) {
        updateUrlParam('search', searchInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, searchParams, updateUrlParam]);

  // Fetch Logic
  // Convert URLSearchParams to a plain object for React Query key and API payload
  const filtersObject = useMemo(() => {
    const obj: Record<string, string | number> = {};
    searchParams.forEach((val, key) => {
      obj[key] = val;
    });
    // Default values if not in URL
    if (!obj.page) obj.page = 1;
    if (!obj.limit) obj.limit = 12; // 12 items per page
    if (!obj.sort) obj.sort = 'newest';
    return obj;
  }, [searchParams]);

  const { data: response, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['products', filtersObject],
    queryFn: () => productService.getProducts(filtersObject),
    // Keep previous data while fetching next page for smooth pagination
    placeholderData: (prev) => prev,
  });

  const products = response?.data?.products || [];
  const pagination = response?.data?.pagination;

  // Active Chips
  const activeFilters = useMemo(() => {
    const chips: { key: string; value: string }[] = [];
    const ignoreKeys = ['page', 'limit', 'sort', 'search'];
    searchParams.forEach((val, key) => {
      if (!ignoreKeys.includes(key)) {
        chips.push({ key, value: val });
      }
    });
    return chips;
  }, [searchParams]);

  const removeFilter = (key: string) => updateUrlParam(key, null);
  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (searchParams.get('search')) params.set('search', searchParams.get('search')!);
    if (searchParams.get('sort')) params.set('sort', searchParams.get('sort')!);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParam('page', newPage.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === filtersObject.sort)?.label || 'Newest Arrivals';

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shop Collection</h1>
          <p className="text-muted-foreground mt-1">
            {pagination?.total ? `${pagination.total} Products` : 'Loading...'}
          </p>
        </div>
        
        <div className="relative w-full md:w-96 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="pl-9 pr-10 rounded-full bg-muted/50 border-transparent focus:bg-background transition-colors"
            />
            {searchInput && (
              <button 
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-2">
        {/* Desktop Sidebar */}
        <FilterSidebar />

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0">
          
          {/* Toolbar (Mobile Filters + Sort + Active Chips) */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between gap-4 sticky top-[60px] z-30 bg-background/95 backdrop-blur-md py-3 lg:static lg:bg-transparent lg:py-0">
              
              {/* Mobile Filter Trigger */}
              <div className="lg:hidden">
                <Button 
                  variant="outline" 
                  className="rounded-full flex items-center gap-2"
                  onClick={() => setIsMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilters.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {activeFilters.length}
                    </span>
                  )}
                </Button>
                
                {/* Custom Mobile Drawer */}
                <AnimatePresence>
                  {isMobileFiltersOpen && (
                    <div className="fixed inset-0 z-50 flex">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileFiltersOpen(false)}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                      />
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative z-50 w-[300px] h-full bg-background border-r shadow-2xl p-6"
                      >
                        <FilterSidebar isMobile onClose={() => setIsMobileFiltersOpen(false)} />
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Desktop Active Chips */}
              <div className="hidden lg:flex flex-wrap items-center gap-2 flex-1">
                <AnimatePresence>
                  {activeFilters.map((filter) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key={filter.key} 
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm font-medium border border-border/50"
                    >
                      <span className="capitalize">{filter.key}: {filter.value}</span>
                      <button onClick={() => removeFilter(filter.key)} className="hover:bg-background rounded-full p-0.5 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                  {activeFilters.length > 0 && (
                    <motion.button 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={clearAllFilters}
                      className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 ml-2"
                    >
                      Clear all
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <span className="text-sm text-muted-foreground hidden sm:inline-block">Sort by:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <div className="flex h-10 items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                      {currentSortLabel}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] rounded-2xl p-2 shadow-xl border border-border/50">
                    {SORT_OPTIONS.map((opt) => (
                      <DropdownMenuItem 
                        key={opt.value}
                        onClick={() => updateUrlParam('sort', opt.value)}
                        className={cn("rounded-xl cursor-pointer", filtersObject.sort === opt.value && "bg-secondary font-semibold")}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Mobile Active Chips (rendered below toolbar on small screens) */}
            {activeFilters.length > 0 && (
              <div className="flex lg:hidden flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <div key={filter.key} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm font-medium border border-border/50">
                    <span className="capitalize">{filter.value}</span>
                    <button onClick={() => removeFilter(filter.key)} className="hover:bg-background rounded-full p-0.5 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button onClick={clearAllFilters} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 ml-2">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Grid Area */}
          <div className="relative min-h-[500px]">
            {/* Loading Overlay when paginating/filtering */}
            {isFetching && !isLoading && (
              <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[2px] flex items-start justify-center pt-20 rounded-2xl transition-opacity">
                <div className="bg-background shadow-lg border rounded-full p-3 flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">Updating...</span>
                </div>
              </div>
            )}

            {isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState 
                onClearFilters={activeFilters.length > 0 || searchInput ? clearAllFilters : undefined} 
                showBrowse={false} 
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && !isError && pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                disabled={Number(pagination.page) <= 1 || isFetching}
                onClick={() => handlePageChange(Number(pagination.page) - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-sm font-medium">
                Page {pagination.page} of {pagination.pages}
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                disabled={Number(pagination.page) >= pagination.pages || isFetching}
                onClick={() => handlePageChange(Number(pagination.page) + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Global Quick View Modal for PLP */}
      <QuickViewModal />
    </div>
  );
}
