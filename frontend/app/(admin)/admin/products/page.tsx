import { ProductTable } from '@/components/admin/ProductTable';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <p className="text-muted-foreground">
          Manage your store&apos;s inventory and product listings.
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>}>
        <ProductTable />
      </Suspense>
    </div>
  );
}
