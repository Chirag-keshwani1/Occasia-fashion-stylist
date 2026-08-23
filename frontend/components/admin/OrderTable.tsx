/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminService } from '@/lib/services/admin.service';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function OrderTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || '';
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['admin', 'orders', page, status],
    queryFn: () => adminService.getOrders({ page, limit: 10, status }),
    placeholderData: keepPreviousData,
  });

  const handleStatusFilter = (newStatus: string) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string, newStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' }) => 
      adminService.updateOrderStatus(id, { status: newStatus }),
    onMutate: () => {
      // Could do optimistic UI here, but since it's admin, safer to just show loading
    },
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: (error: any) => {
      toast.error((error as any)?.response?.data?.message || 'Failed to update order status');
    },
    onSettled: () => {
      setUpdatingId(null);
    }
  });

  const onStatusChange = (orderId: string, newStatus: any) => {
    setUpdatingId(orderId);
    updateStatusMutation.mutate({ id: orderId, newStatus });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex bg-muted rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
          {['', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize whitespace-nowrap transition-colors ${
                status === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s || 'All Orders'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0 animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-32 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-4 w-16 bg-muted rounded"></div></td>
                  <td className="px-4 py-4"><div className="h-6 w-24 bg-muted rounded"></div></td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                  Failed to load orders.
                </td>
              </tr>
            ) : response?.data?.orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            ) : (
              response?.data?.orders.map((order) => (
                <tr key={order._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    #{order._id.substring(order._id.length - 6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{order.shippingAddress?.fullName || 'N/A'}</span>
                      <span className="text-xs text-muted-foreground">
                        {(order.userId as any)?.email || 'Guest'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select 
                        value={order.status}
                        onChange={(e) => onStatusChange(order._id, e.target.value)}
                        disabled={updatingId === order._id || order.status === 'cancelled'}
                        className={`text-xs font-medium px-2 py-1 rounded-md border bg-transparent ${
                          order.status === 'pending' ? 'text-amber-500 border-amber-500/30' :
                          order.status === 'confirmed' ? 'text-blue-500 border-blue-500/30' :
                          order.status === 'shipped' ? 'text-purple-500 border-purple-500/30' :
                          order.status === 'delivered' ? 'text-emerald-500 border-emerald-500/30' :
                          'text-destructive border-destructive/30'
                        } disabled:opacity-50`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {updatingId === order._id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
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
