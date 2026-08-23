import { Metadata } from 'next';
import { CheckoutClient } from '@/components/shop/CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout | Occasia',
  description: 'Complete your purchase',
};

export default function CheckoutPage() {
  return (
    <div className="container py-10 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>
      <CheckoutClient />
    </div>
  );
}
