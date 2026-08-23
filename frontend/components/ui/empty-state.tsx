import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onClearFilters?: () => void;
  showBrowse?: boolean;
}

export function EmptyState({ 
  title = "No products found", 
  message = "We couldn't find anything matching your current filters. Try adjusting them.",
  onClearFilters,
  showBrowse = false
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] w-full bg-muted/20 rounded-2xl border border-dashed">
      <div className="h-16 w-16 bg-muted text-muted-foreground flex items-center justify-center rounded-full mb-4">
        <SearchX className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {message}
      </p>
      <div className="flex gap-4">
        {onClearFilters && (
          <Button onClick={onClearFilters} variant="outline" className="rounded-full">
            Clear Filters
          </Button>
        )}
        {showBrowse && (
          <Link href="/shop" passHref>
            <Button className="rounded-full">
              Browse All
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
