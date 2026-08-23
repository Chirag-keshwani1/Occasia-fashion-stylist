import { Suspense } from 'react';
import { ProductListingClient } from '@/components/shop/ProductListingClient';
import { Loader2 } from 'lucide-react';

export default function ShopPage() {
  return (
    <div className="flex-1 w-full flex flex-col bg-background min-h-screen">
      {/* 
        We use Suspense here because ProductListingClient uses useSearchParams.
        In Next.js App Router, using useSearchParams in a client component 
        requires wrapping it in a Suspense boundary if the route is statically rendered.
      */}
      <Suspense fallback={
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <ProductListingClient />
      </Suspense>
    </div>
  );
}
