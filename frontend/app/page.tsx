import { Metadata } from 'next';
import { HeroSection } from '@/components/landing/HeroSection';
import { AiStylistDemo } from '@/components/landing/AiStylistDemo';
import { OutfitGeneratorDemo } from '@/components/landing/OutfitGeneratorDemo';
import { PersonalizedRecommendations } from '@/components/landing/PersonalizedRecommendations';
import { CompleteTheLookSection } from '@/components/landing/CompleteTheLookSection';
import { SmartShoppingSection } from '@/components/landing/SmartShoppingSection';
import { VirtualTryOnSection } from '@/components/landing/VirtualTryOnSection';
import { FinalCTA } from '@/components/landing/FinalCTA';

export const metadata: Metadata = {
  title: 'Occasia - AI Powered Premium Fashion Discovery',
  description: 'Your AI Stylist. Discover a curated collection of premium fashion across brands, intelligently tailored to your unique taste, body type, and lifestyle.',
};

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full bg-background">
      <HeroSection />
      <AiStylistDemo />
      <OutfitGeneratorDemo />
      <CompleteTheLookSection />
      <SmartShoppingSection />
      <PersonalizedRecommendations />
      <VirtualTryOnSection />
      <FinalCTA />
    </div>
  );
}
