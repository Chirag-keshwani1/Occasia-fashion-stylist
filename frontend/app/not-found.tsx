import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-muted p-4 rounded-full mb-6">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8 text-lg">
        We couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button size="lg">Return Home</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" size="lg">Shop Products</Button>
        </Link>
      </div>
    </div>
  );
}
