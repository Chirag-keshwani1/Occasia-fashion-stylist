'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService, OutfitResponse, OutfitItem } from '@/lib/services/ai.service';
import { ProductCard } from '@/components/cards/ProductCard';
import { Loader2, Trash2, MessageSquare, BookHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function SavedOutfitsClient() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['savedOutfits'],
    queryFn: () => aiService.getSavedOutfits(),
  });

  const deleteMutation = useMutation({
    mutationFn: (outfitId: string) => aiService.deleteOutfit(outfitId),
    onSuccess: () => {
      toast.success('Outfit removed');
      queryClient.invalidateQueries({ queryKey: ['savedOutfits'] });
    },
    onError: () => {
      toast.error('Failed to remove outfit');
    }
  });

  const outfits = data?.data?.data?.outfits || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (outfits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <BookHeart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No saved outfits yet</h2>
        <p className="text-muted-foreground mb-8">Generate and save outfits to see them here.</p>
        <Link href="/outfits">
          <Button size="lg" className="rounded-full px-8">Generate Outfits</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {outfits.map((outfit: OutfitResponse) => (
        <div key={outfit.outfitId} className="bg-muted/10 border rounded-3xl p-6 md:p-8 flex flex-col gap-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold uppercase tracking-wide text-primary">{outfit.styleName}</h3>
              <p className="text-muted-foreground mt-2 max-w-3xl">{outfit.aiRationale}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => deleteMutation.mutate(outfit.outfitId)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
              <Button 
                size="sm"
                onClick={() => router.push(`/chat?outfitId=${outfit.outfitId}`)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Discuss
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {outfit.items.map((item: OutfitItem, i: number) => (
              <div key={`${item.product._id}-${i}`} className="flex flex-col gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  {item.category}
                </span>
                <ProductCard product={item.product} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
