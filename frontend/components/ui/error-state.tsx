import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "We couldn't load the products. Please try again.", 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] w-full bg-muted/20 rounded-2xl border border-dashed">
      <div className="h-16 w-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-full mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="rounded-full">
          Try Again
        </Button>
      )}
    </div>
  );
}
