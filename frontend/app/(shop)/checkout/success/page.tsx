import { Metadata } from 'next';
import { OrderSuccessClient } from '@/components/shop/OrderSuccessClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Order Success | Occasia',
  description: 'Thank you for your order',
};

export default function OrderSuccessPage() {
  return (
    <div className="container py-10 md:py-20 flex justify-center">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />}>
        <OrderSuccessClient />
      </Suspense>
    </div>
  );
}
