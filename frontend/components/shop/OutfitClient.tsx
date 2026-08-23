'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiService, OutfitContext, OutfitResponse } from '@/lib/services/ai.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2, MessageSquare, BookmarkPlus } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCard } from '@/components/cards/ProductCard';
import { useRouter } from 'next/navigation';

export function OutfitClient() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [nlpText, setNlpText] = useState('');
  
  // Advanced filters state
  const [context, setContext] = useState<OutfitContext>({
    season: '',
    occasion: '',
    destination: '',
    budget: undefined,
    stylePreference: '',
  });

  const [outfits, setOutfits] = useState<OutfitResponse[]>([]);
  const [interpretedContext, setInterpretedContext] = useState<OutfitContext | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (useAdvanced) {
        // Remove empty strings for advanced filters
        const cleanContext: Partial<OutfitContext> = {};
        if (context.season) cleanContext.season = context.season;
        if (context.occasion) cleanContext.occasion = context.occasion;
        if (context.destination) cleanContext.destination = context.destination;
        if (context.budget) cleanContext.budget = Number(context.budget);
        if (context.stylePreference) cleanContext.stylePreference = context.stylePreference;
        
        return aiService.generateOutfit(cleanContext);
      } else {
        if (!nlpText.trim()) throw new Error('Please describe what you are looking for.');
        return aiService.parseAndGenerateOutfit(nlpText);
      }
    },
    onSuccess: (response: { data: { data: { outfits: OutfitResponse[], interpretedContext?: OutfitContext } } }) => {
      setOutfits(response.data.data.outfits);
      if ('interpretedContext' in response.data.data) {
        setInterpretedContext(response.data.data.interpretedContext as OutfitContext);
      } else {
        setInterpretedContext(null);
      }
      // Scroll to results
      setTimeout(() => {
        document.getElementById('outfit-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    onError: (err: Error | { response?: { data?: { message?: string } } }) => {
      // @ts-expect-error err shape is from axios
      toast.error(err.response?.data?.message || 'Failed to generate outfits. Please try again.');
    }
  });

  const saveMutation = useMutation({
    mutationFn: (outfitId: string) => aiService.saveOutfit(outfitId),
    onSuccess: () => {
      toast.success('Outfit saved successfully!');
    },
    onError: () => {
      toast.error('Failed to save outfit.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate();
  };

  const favoriteStyles = user?.preferences?.favoriteStyles || [];
  const suggestionText = favoriteStyles.length > 0 
    ? `something in a ${favoriteStyles.join(', ')} style` 
    : 'a stylish summer outfit for a beach party';

  return (
    <div className="flex flex-col gap-12">
      {/* Input Section */}
      <div className="bg-muted/30 rounded-3xl p-6 md:p-10 border shadow-sm max-w-3xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            {useAdvanced ? 'Advanced Filters' : 'Describe your vibe'}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setUseAdvanced(!useAdvanced)}
            className="text-muted-foreground"
          >
            {useAdvanced ? 'Use natural language instead' : 'Use advanced filters instead'}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {!useAdvanced ? (
            <div className="flex flex-col gap-3">
              <Textarea
                placeholder="E.g., I need a cheap smart casual outfit for a summer wedding in Goa..."
                className="min-h-[120px] text-lg resize-none p-4 rounded-xl"
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                autoFocus
              />
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Try:</span>
                <button
                  type="button"
                  onClick={() => setNlpText(suggestionText)}
                  className="text-sm bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors font-medium text-left"
                >
                  &quot;{suggestionText}&quot;
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Occasion</Label>
                <Select value={context.occasion} onValueChange={(val: string | null) => setContext({...context, occasion: val || undefined})}>
                  <SelectTrigger><SelectValue placeholder="Any occasion" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any occasion</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="beach">Beach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Season</Label>
                <Select value={context.season} onValueChange={(val: string | null) => setContext({...context, season: val || undefined})}>
                  <SelectTrigger><SelectValue placeholder="Any season" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any season</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Budget (₹)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 5000" 
                  value={context.budget || ''} 
                  onChange={(e) => setContext({...context, budget: e.target.value ? Number(e.target.value) : undefined})}
                />
              </div>
              <div className="space-y-2">
                <Label>Destination (Optional)</Label>
                <Input 
                  placeholder="e.g. Paris, Goa" 
                  value={context.destination || ''} 
                  onChange={(e) => setContext({...context, destination: e.target.value})}
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 rounded-xl text-lg font-bold"
            disabled={generateMutation.isPending || (!useAdvanced && !nlpText.trim())}
          >
            {generateMutation.isPending ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Curating Outfits...</>
            ) : (
              <><Wand2 className="h-5 w-5 mr-2" /> Generate Outfits</>
            )}
          </Button>
        </form>
      </div>

      {/* Results Section */}
      {outfits.length > 0 && (
        <div id="outfit-results" className="flex flex-col gap-12 pt-8 border-t">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">We curated {outfits.length} outfits for you</h2>
            {interpretedContext && (
              <div className="flex flex-wrap gap-2 justify-center text-sm">
                <span className="text-muted-foreground">Interpreted from your prompt:</span>
                {interpretedContext.occasion && <span className="bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground font-medium">{interpretedContext.occasion}</span>}
                {interpretedContext.season && <span className="bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground font-medium">{interpretedContext.season}</span>}
                {interpretedContext.budget && <span className="bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground font-medium">Max ₹{interpretedContext.budget}</span>}
                {interpretedContext.destination && <span className="bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground font-medium">{interpretedContext.destination}</span>}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-16">
            {outfits.map((outfit, idx) => (
              <div key={outfit.outfitId || idx} className="bg-muted/10 border rounded-3xl p-6 md:p-8 flex flex-col gap-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-bold uppercase tracking-wide text-primary">{outfit.styleName}</h3>
                    <p className="text-muted-foreground mt-2 max-w-3xl">{outfit.aiRationale}</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push('/login');
                          return;
                        }
                        saveMutation.mutate(outfit.outfitId);
                      }}
                      disabled={saveMutation.isPending || !outfit.outfitId}
                    >
                      <BookmarkPlus className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push('/login');
                          return;
                        }
                        // Create chat session with this outfit
                        router.push(`/chat?outfitId=${outfit.outfitId}`);
                      }}
                      disabled={!outfit.outfitId}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Discuss
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {outfit.items.map((item, i) => (
                    <div key={`${item.product._id}-${i}`} className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">
                        {item.category}
                      </span>
                      <ProductCard product={item.product} />
                    </div>
                  ))}
                </div>

                {outfit.stylingTip && (
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex gap-4 items-start">
                    <div className="bg-primary/10 p-2 rounded-full shrink-0">
                      <Wand2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-1">Stylist Tip</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{outfit.stylingTip}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
