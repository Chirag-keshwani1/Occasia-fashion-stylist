'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Hardcoded for demonstration, ideally fetched from backend /api/metadata if supported.
const FILTER_OPTIONS = {
  category: ['top', 'bottom', 'outerwear', 'dress', 'footwear', 'accessory'],
  brand: ['Nike', 'Adidas', 'Uniqlo', 'Zara', 'H&M', 'Gucci', 'Prada'],
  gender: ['men', 'women', 'unisex'],
  colorFamily: ['black', 'white', 'blue', 'red', 'green', 'yellow', 'brown', 'grey'],
  seasonTags: ['spring', 'summer', 'fall', 'winter'],
  occasionTags: ['casual', 'work', 'party', 'formal', 'travel', 'workout'],
  formalityLevel: ['1', '2', '3', '4', '5'],
};

interface FilterSectionProps {
  title: string;
  paramKey: string;
  options: string[];
  searchParams: URLSearchParams;
  updateFilter: (key: string, value: string) => void;
}

function FilterSection({ title, paramKey, options, searchParams, updateFilter }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const selected = searchParams.get(paramKey);

  return (
    <div className="border-b py-4 last:border-0">
      <button 
        className="flex w-full items-center justify-between font-medium py-2 text-sm uppercase tracking-wider"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pt-2">
              {options.map(option => {
                const isActive = selected === option;
                return (
                  <button
                    key={option}
                    onClick={() => updateFilter(paramKey, isActive ? '' : option)}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                      isActive ? "bg-primary border-primary text-primary-foreground" : "border-input"
                    )}>
                      {isActive && <Check className="h-3 w-3" />}
                    </div>
                    <span className="capitalize">{option}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterSidebar({ isMobile = false, onClose }: { isMobile?: boolean, onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const rawSearchParams = useSearchParams();
  // We need a stable searchParams object to avoid constant re-renders if we use it directly in dependencies
  const searchParams = new URLSearchParams(rawSearchParams.toString());

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(rawSearchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Always reset page to 1 on filter change
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, rawSearchParams]);

  const clearFilters = () => {
    const params = new URLSearchParams(rawSearchParams.toString());
    // Keep search and sort, remove everything else
    const search = params.get('search');
    const sort = params.get('sort');
    
    // Create fresh params
    const newParams = new URLSearchParams();
    if (search) newParams.set('search', search);
    if (sort) newParams.set('sort', sort);
    
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  const content = (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="h-4 w-4" />
          <h2>Filters</h2>
        </div>
        {isMobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2 pr-2 scrollbar-thin">
        <FilterSection title="Category" paramKey="category" options={FILTER_OPTIONS.category} searchParams={searchParams} updateFilter={updateFilter} />
        <FilterSection title="Brand" paramKey="brand" options={FILTER_OPTIONS.brand} searchParams={searchParams} updateFilter={updateFilter} />
        <FilterSection title="Gender" paramKey="gender" options={FILTER_OPTIONS.gender} searchParams={searchParams} updateFilter={updateFilter} />
        <FilterSection title="Color" paramKey="color" options={FILTER_OPTIONS.colorFamily} searchParams={searchParams} updateFilter={updateFilter} />
        <FilterSection title="Season" paramKey="season" options={FILTER_OPTIONS.seasonTags} searchParams={searchParams} updateFilter={updateFilter} />
        <FilterSection title="Occasion" paramKey="occasion" options={FILTER_OPTIONS.occasionTags} searchParams={searchParams} updateFilter={updateFilter} />
        <FilterSection title="Formality" paramKey="formality" options={FILTER_OPTIONS.formalityLevel} searchParams={searchParams} updateFilter={updateFilter} />
      </div>

      <div className="pt-4 border-t mt-4">
        <Button variant="outline" className="w-full rounded-full" onClick={clearFilters}>
          Clear All Filters
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return content;
  }

  return (
    <aside className="hidden lg:block w-[280px] shrink-0 sticky top-24 h-[calc(100vh-8rem)]">
      {content}
    </aside>
  );
}
