import { Metadata } from 'next';
import { SavedOutfitsClient } from '@/components/shop/SavedOutfitsClient';

export const metadata: Metadata = {
  title: 'Saved Outfits | Occasia',
  description: 'View your saved AI outfits',
};

export default function SavedOutfitsPage() {
  return (
    <div className="container py-10 md:py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Saved Outfits</h1>
      <SavedOutfitsClient />
    </div>
  );
}
