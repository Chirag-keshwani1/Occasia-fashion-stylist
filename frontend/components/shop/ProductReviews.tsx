'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/lib/services/review.service';
import { APP_CONFIG } from '@/lib/constants/config';
import { Star, User, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore'; 

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isWriting, setIsWriting] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: () => reviewService.getProductReviews(productId, page, 5),
    placeholderData: (prev) => prev,
  });

  const reviews = response?.data?.reviews || [];
  const pagination = response?.data?.pagination;

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const submitReview = useMutation({
    mutationFn: () => reviewService.createReview(productId, { rating, title, body }),
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      setIsWriting(false);
      setRating(5);
      setTitle('');
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReview.mutate();
  };

  return (
    <div className="py-12 border-t border-border/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">{APP_CONFIG.UI.REVIEWS}</h2>
          <p className="text-muted-foreground">
            {pagination?.total ? `Read what ${pagination.total} customers have to say.` : 'Be the first to review this product.'}
          </p>
        </div>
        
        <Button 
          size="lg" 
          variant={isWriting ? "outline" : "default"}
          className="rounded-full"
          onClick={() => {
            if (!isAuthenticated) {
              toast.info('Please log in to write a review.');
              // router.push('/login');
              return;
            }
            setIsWriting(!isWriting);
          }}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {isWriting ? 'Cancel' : 'Write a Review'}
        </Button>
      </div>

      {isWriting && isAuthenticated && (
        <form onSubmit={handleSubmit} className="bg-muted/30 border rounded-3xl p-6 md:p-8 mb-12 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-semibold mb-6">Share your thoughts</h3>
          
          <div className="flex flex-col gap-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star className={`h-8 w-8 ${star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground opacity-30'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">Review Title (Optional)</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Summarize your experience"
              />
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium mb-2">Review Details (Optional)</label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="What did you like or dislike?"
              />
            </div>

            <Button type="submit" size="lg" className="rounded-full w-fit px-8" disabled={submitReview.isPending}>
              {submitReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-destructive py-8 text-center bg-destructive/10 rounded-2xl">
          Failed to load reviews. Please try again later.
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed">
          <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No reviews yet</h3>
          <p className="text-muted-foreground">We are waiting for the first review.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {reviews.map((review) => (
            <div key={review._id} className="p-6 md:p-8 rounded-3xl border bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">{typeof review.userId === 'object' ? review.userId.name : 'Anonymous User'}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${star <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`} 
                    />
                  ))}
                </div>
              </div>
              
              {review.title && <h4 className="font-bold text-lg mb-2">{review.title}</h4>}
              {review.body && <p className="text-muted-foreground leading-relaxed">{review.body}</p>}
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button 
                variant="outline" 
                className="rounded-full"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm font-medium">Page {page} of {pagination.pages}</span>
              <Button 
                variant="outline" 
                className="rounded-full"
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
