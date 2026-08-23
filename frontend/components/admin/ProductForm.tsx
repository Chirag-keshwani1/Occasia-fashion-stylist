'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CreateProductDTO } from '@/types/admin';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Product } from '@/types/product';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  gender: z.string().min(1, 'Gender is required'),
  colorFamily: z.string().min(1, 'Color family is required'),
  formalityLevel: z.number().min(1).max(5).optional(),
  styleTags: z.string().optional(), // Will be split by comma
  seasonTags: z.string().min(1, 'Season is required'), // Will be split by comma
  occasionTags: z.string().min(1, 'Occasion is required'), // Will be split by comma
  externalUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  variants: z.array(z.object({
    size: z.string().min(1, 'Size is required'),
    stock: z.number().min(0, 'Stock must be non-negative'),
  })).min(1, 'At least one variant is required')
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: CreateProductDTO) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProductForm({ initialData, onSubmit, isSubmitting = false }: ProductFormProps) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      category: initialData?.category || '',
      brand: initialData?.brand || '',
      gender: initialData?.gender || '',
      colorFamily: initialData?.colorFamily || '',
      formalityLevel: initialData?.formalityLevel || 3,
      styleTags: initialData?.styleTags?.join(', ') || '',
      seasonTags: initialData?.seasonTags?.join(', ') || '',
      occasionTags: initialData?.occasionTags?.join(', ') || '',
      externalUrl: initialData?.externalUrl || '',
      variants: initialData?.variants?.map(v => ({
        size: v.size,
        stock: v.stock,
      })) || [{ size: '', stock: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    name: 'variants',
    control,
  });

  const onFormSubmit = async (data: ProductFormValues) => {
    const submitData: CreateProductDTO = {
      ...data,
      styleTags: data.styleTags ? data.styleTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      seasonTags: data.seasonTags ? data.seasonTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      occasionTags: data.occasionTags ? data.occasionTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      externalUrl: data.externalUrl || null,
    };
    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Name</label>
          <Input {...register('name')} placeholder="Product Name" disabled={isSubmitting} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea {...register('description')} placeholder="Product Description" rows={4} disabled={isSubmitting} />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">External Retailer URL (Optional)</label>
          <Input type="url" {...register('externalUrl')} placeholder="https://..." disabled={isSubmitting} />
          {errors.externalUrl && <p className="text-sm text-destructive">{errors.externalUrl.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Price</label>
          <Input type="number" step="0.01" {...register('price', { valueAsNumber: true })} disabled={isSubmitting} />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Brand</label>
          <Input {...register('brand')} placeholder="Brand Name" disabled={isSubmitting} />
          {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Input {...register('category')} placeholder="e.g. dresses, shirts" disabled={isSubmitting} />
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Gender</label>
          <Input {...register('gender')} placeholder="men, women, unisex" disabled={isSubmitting} />
          {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Color Family</label>
          <Input {...register('colorFamily')} placeholder="e.g. black, blue, red" disabled={isSubmitting} />
          {errors.colorFamily && <p className="text-sm text-destructive">{errors.colorFamily.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Formality Level (1-5)</label>
          <Input type="number" {...register('formalityLevel', { valueAsNumber: true })} min={1} max={5} disabled={isSubmitting} />
          {errors.formalityLevel && <p className="text-sm text-destructive">{errors.formalityLevel.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Style Tags (comma separated)</label>
          <Input {...register('styleTags')} placeholder="e.g. casual, formal" disabled={isSubmitting} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Season Tags (comma separated)</label>
          <Input {...register('seasonTags')} placeholder="e.g. summer, winter" disabled={isSubmitting} />
          {errors.seasonTags && <p className="text-sm text-destructive">{errors.seasonTags.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Occasion Tags (comma separated)</label>
          <Input {...register('occasionTags')} placeholder="e.g. party, work" disabled={isSubmitting} />
          {errors.occasionTags && <p className="text-sm text-destructive">{errors.occasionTags.message}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Variants (Inventory)</h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => append({ size: '', stock: 0 })}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </div>
        
        {errors.variants?.message && (
          <p className="text-sm text-destructive">{errors.variants.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Size</label>
                <Input {...register(`variants.${index}.size` as const)} placeholder="S, M, L..." disabled={isSubmitting} />
                {errors.variants?.[index]?.size && <p className="text-xs text-destructive">{errors.variants[index]?.size?.message}</p>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Stock</label>
                <Input type="number" {...register(`variants.${index}.stock` as const, { valueAsNumber: true })} disabled={isSubmitting} />
                {errors.variants?.[index]?.stock && <p className="text-xs text-destructive">{errors.variants[index]?.stock?.message}</p>}
              </div>
              <div className="pt-8">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1 || isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
