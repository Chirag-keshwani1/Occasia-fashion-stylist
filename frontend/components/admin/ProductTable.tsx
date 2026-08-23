/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminService } from '@/lib/services/admin.service';
import { Product } from '@/types/product';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Image as ImageIcon, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { toast } from 'sonner';

export function ProductTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'products', page, search],
    queryFn: () => adminService.getProducts({ page, limit: 10, search }),
    placeholderData: keepPreviousData,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput) {
      params.set('search', searchInput);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      if (product.isActive) {
        await adminService.deactivateProduct(product._id);
        toast.success('Product deactivated');
      } else {
        await adminService.activateProduct(product._id);
        toast.success('Product activated');
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update product status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search products..." 
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Link 
          href="/admin/products/new" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 whitespace-nowrap"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0 animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 w-48 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-16 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-16 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded ml-auto"></div></td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                  Failed to load products.
                </td>
              </tr>
            ) : response?.data?.products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            ) : (
              response?.data?.products.map((product) => (
                <tr key={product._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{product.brand}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{product.category}</td>
                  <td className="px-4 py-3">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleActive(product)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title={product.isActive ? "Deactivate" : "Activate"}
                      >
                        <Activity className="h-4 w-4" />
                      </button>
                      <Link 
                        href={`/admin/products/${product._id}`}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {response?.data?.pagination && response.data.pagination.pages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
            className="p-2 rounded-md border bg-card hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            Page {page} of {response.data.pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === response.data.pagination.pages || isLoading}
            className="p-2 rounded-md border bg-card hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
