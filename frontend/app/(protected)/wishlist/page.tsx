import { Metadata } from 'next';
import { WishlistClient } from '@/components/shop/WishlistClient';

export const metadata: Metadata = {
  title: 'My Wishlist | Occasia',
  description: 'View and manage your saved items',
};

export default function WishlistPage() {
  return (
    <div className="container py-10 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Wishlist</h1>
      <WishlistClient />
    </div>
  );
}
