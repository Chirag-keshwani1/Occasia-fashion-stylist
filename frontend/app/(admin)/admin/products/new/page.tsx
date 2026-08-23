/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ProductForm } from '@/components/admin/ProductForm';
import { adminService } from '@/lib/services/admin.service';
import { CreateProductDTO } from '@/types/admin';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateProductDTO) => {
    setIsSubmitting(true);
    try {
      const response = await adminService.createProduct(data);
      toast.success('Product created successfully');
      // Redirect to edit page to allow uploading images
      router.push(`/admin/products/${response.data.product._id}`);
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/products"
          className="p-2 border rounded-md hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Product</h2>
          <p className="text-muted-foreground">
            Add a new product to your store catalog.
          </p>
        </div>
      </div>

      <div className="p-6 bg-card border rounded-xl shadow-sm">
        <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
