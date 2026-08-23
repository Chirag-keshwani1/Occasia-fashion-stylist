/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { adminService } from '@/lib/services/admin.service';
import { Product } from '@/types/product';
import { toast } from 'sonner';

interface ImageUploaderProps {
  product: Product;
  onSuccess: () => void;
}

export function ImageUploader({ product, onSuccess }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate size and type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      if (!validTypes.includes(files[i].type)) {
        toast.error(`Invalid file type: ${files[i].name}. Only JPG, PNG, WEBP allowed.`);
        return;
      }
      if (files[i].size > MAX_SIZE) {
        toast.error(`File too large: ${files[i].name}. Max size is 5MB.`);
        return;
      }
    }

    if (product.images && product.images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed per product');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading images...');
    
    try {
      await adminService.uploadImages(product._id, formData);
      toast.success('Images uploaded successfully', { id: toastId });
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess();
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || 'Failed to upload images', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageUrl: string) => {
    setDeletingId(imageUrl);
    try {
      await adminService.deleteImage(product._id, imageUrl);
      toast.success('Image deleted successfully');
      onSuccess();
    } catch (error) {
      toast.error((error as any)?.response?.data?.message || 'Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {product.images?.map((imageUrl, index) => (
          <div key={imageUrl} className="relative group aspect-square rounded-md overflow-hidden bg-muted border">
            <img 
              src={imageUrl} 
              alt={`Product ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(imageUrl)}
                disabled={deletingId === imageUrl}
                className="h-8 w-8 rounded-full"
              >
                {deletingId === imageUrl ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-sm font-semibold shadow">
                Primary
              </div>
            )}
          </div>
        ))}

        {(!product.images || product.images.length < 5) && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
            )}
            <span className="text-xs text-muted-foreground font-medium">
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </span>
          </button>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        multiple 
        accept="image/jpeg, image/png, image/webp"
      />
      
      <p className="text-sm text-muted-foreground">
        Upload up to 5 images. Supported formats: JPG, PNG, WEBP. Max size: 5MB per image.
        The first image will be used as the primary thumbnail.
      </p>
    </div>
  );
}
