import { Skeleton } from '@/components/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl p-3">
      {/* Image Skeleton */}
      <Skeleton className="aspect-[4/5] w-full rounded-xl" />
      
      <div className="flex flex-col gap-2 px-1 mt-1">
        {/* Brand & Rating Skeleton */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-10" />
        </div>
        
        {/* Title Skeleton */}
        <Skeleton className="h-5 w-[80%]" />
        
        {/* Price Skeleton */}
        <Skeleton className="h-5 w-24 mt-1" />
      </div>
    </div>
  );
}
