import { Product } from '@/types/product';
import posthog from 'posthog-js';

// In-memory duplicate prevention (very simple throttling)
let lastTrackedId: string | null = null;
let lastTrackedTime: number = 0;

export const analyticsService = {
  trackOutboundClick: async (product: Product) => {
    try {
      const now = Date.now();
      // Prevent accidental double-tracking within 1000ms
      if (lastTrackedId === product._id && now - lastTrackedTime < 1000) {
        return;
      }
      
      lastTrackedId = product._id;
      lastTrackedTime = now;

      const getDomain = (url: string) => {
        try {
          return new URL(url).hostname;
        } catch {
          return url; // fallback
        }
      };

      const eventPayload = {
        eventName: 'outbound_retailer_click',
        productId: product._id,
        productName: product.name,
        brand: product.brand,
        retailerDomain: product.externalUrl ? getDomain(product.externalUrl) : 'unknown',
        timestamp: new Date().toISOString(),
        location: typeof window !== 'undefined' ? window.location.pathname : '', // Minimum necessary location, not full URL
      };

      // Send to PostHog if available
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.capture('outbound_retailer_click', eventPayload);
      } else {
        // Fallback for development if no posthog key is set
        console.info('[Analytics Event Recorded]', eventPayload);
      }
      
      // We do not await posthog.capture or artificial latency anymore to ensure navigation is unblocked instantly
    } catch (e) {
      // Analytics must never throw and prevent the user from reaching the retailer
      console.error('Analytics tracking failed safely', e);
    }
  }
};
