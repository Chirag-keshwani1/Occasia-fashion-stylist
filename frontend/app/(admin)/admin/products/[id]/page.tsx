/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/lib/services/admin.service';
import { CreateProductDTO } from '@/types/admin';
import { toast } from 'sonner';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ProductForm } from '@/components/admin/ProductForm';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EditProductPage({ params }: { params: { id: string } }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'product', params.id],
    queryFn: () => adminService.getProduct(params.id),
  });

  const handleSubmit = async (data: CreateProductDTO) => {
    setIsSubmitting(true);
    try {
      await adminService.updateProduct(params.id, data);
      toast.success('Product updated successfully');
      refetch();
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !response?.data?.product) {
    return (
      <div className="p-8 text-center bg-destructive/10 text-destructive rounded-xl">
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <p>The product you are trying to edit does not exist or you do not have permission.</p>
        <Link href="/admin/products" className="mt-4 inline-block text-sm underline hover:no-underline">
          Return to Products
        </Link>
      </div>
    );
  }

  const product = response.data.product;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/products"
          className="p-2 border rounded-md hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight line-clamp-1">{product.name}</h2>
          <p className="text-muted-foreground">
            Manage product details, variants, and media.
          </p>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="details">Details & Inventory</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        <div className="mt-6 p-6 bg-card border rounded-xl shadow-sm">
          <TabsContent value="details" className="mt-0">
            <ProductForm 
              initialData={product} 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting} 
            />
          </TabsContent>
          <TabsContent value="media" className="mt-0">
            <ImageUploader 
              product={product} 
              onSuccess={() => refetch()} 
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
