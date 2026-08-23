import { OrderTable } from '@/components/admin/OrderTable';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground">
          View and manage customer orders and their fulfillment status.
        </p>
      </div>

      <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>}>
        <OrderTable />
      </Suspense>
    </div>
  );
}
