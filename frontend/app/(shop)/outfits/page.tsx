import { Metadata } from 'next';
import { OutfitClient } from '@/components/shop/OutfitClient';

export const metadata: Metadata = {
  title: 'AI Stylist | Occasia',
  description: 'Generate personalized outfit recommendations with AI',
};

export default function OutfitsPage() {
  return (
    <div className="container py-10 md:py-16 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Your Personal AI Stylist</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
        Describe what you&apos;re looking for, or use the advanced filters. Our AI stylist will instantly curate complete looks from our catalog.
        </p>
      </div>
      <OutfitClient />
    </div>
  );
}
