'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/lib/services/order.service';
import { CheckCircle2, Loader2, Package, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getMyOrderById(orderId as string),
    enabled: !!orderId,
  });

  if (!orderId) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Order</h1>
        <Link href="/">
          <Button className="rounded-full px-8">Return Home</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (isError || !data?.data?.order) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn&apos;t find the details for this order.</p>
        <Link href="/">
          <Button className="rounded-full px-8">Return Home</Button>
        </Link>
      </div>
    );
  }

  const order = data.data.order;
  const formatPrice = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  return (
    <div className="max-w-2xl w-full">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Thank you for your purchase!</h1>
        <p className="text-muted-foreground text-lg">
          Your order has been placed and is being processed.
        </p>
      </div>

      <div className="border rounded-2xl overflow-hidden mb-8 bg-card">
        <div className="bg-muted/50 px-6 py-4 border-b flex flex-wrap gap-4 justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Order Number</p>
            <p className="font-bold font-mono">{order._id}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="font-bold text-xl">{formatPrice(order.total)}</p>
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Order Summary
          </h3>
          <div className="space-y-4 mb-8">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">{item.qty}x</span>
                  <span>Product ID: {item.productId.slice(-6)} (Size: {item.size})</span>
                </div>
                <span className="font-medium">{formatPrice(item.priceAtOrder * item.qty)}</span>
              </div>
            ))}
          </div>

          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            Shipping Details
          </h3>
          <div className="text-sm text-muted-foreground space-y-1 bg-muted/30 p-4 rounded-xl">
            <p className="font-medium text-foreground">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
            <p className="pt-2">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/orders" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full sm:w-auto rounded-full px-8 h-12">
            View All Orders
          </Button>
        </Link>
        <Link href="/products" className="flex-1 sm:flex-none">
          <Button className="w-full sm:w-auto rounded-full px-8 h-12 gap-2">
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}
