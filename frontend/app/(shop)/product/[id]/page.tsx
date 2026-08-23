import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(
  { params }: ProductPageProps
): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/products/${id}`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    const product = data?.data?.product;
    
    if (product) {
      return {
        title: `${product.name} | Occasia`,
        description: product.description || `Buy ${product.name} at Occasia`,
        openGraph: {
          images: product.images?.length > 0 ? [product.images[0]] : [],
        },
      };
    }
  } catch (error) {
    console.error('Failed to fetch product metadata:', error);
  }
  
  return {
    title: 'Product Not Found | Occasia',
    description: 'Product details',
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Pass the id to a Client Component since we'll rely on React Query and local interactivity
  const { id } = await params;
  return (
    <div className="flex-1 w-full bg-background min-h-screen">
      <Suspense 
        fallback={
          <div className="flex items-center justify-center min-h-[70vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <ProductDetailClient productId={id} />
      </Suspense>
    </div>
  );
}
