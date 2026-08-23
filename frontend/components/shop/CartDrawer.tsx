'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartDrawerStore } from '@/store/useCartDrawerStore';
import { useCart } from '@/hooks/useCart';
import { X, Minus, Plus, ShoppingBag, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export function CartDrawer() {
  const { isOpen, closeDrawer } = useCartDrawerStore();
  const { cart, cartCount, isLoading, updateQty, removeItem } = useCart();

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeDrawer]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-background border-l shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Shopping Cart ({cartCount})
              </h2>
              <button 
                onClick={closeDrawer}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : cart.items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Your cart is empty</h3>
                  <p className="text-muted-foreground max-w-[200px]">
                    Looks like you haven&apos;t added any items to your cart yet.
                  </p>
                  <Button onClick={closeDrawer} className="mt-4 rounded-full px-8">
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="flex gap-4">
                      {/* Image */}
                      <div className="relative h-24 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                        {item.product?.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex flex-col flex-1 py-1">
                        <div className="flex justify-between items-start gap-2">
                          <Link 
                            href={`/product/${item.productId}`} 
                            onClick={closeDrawer}
                            className="font-medium line-clamp-2 hover:underline"
                          >
                            {item.product?.name}
                          </Link>
                          <button
                            onClick={() => removeItem.mutate({ productId: item.productId, size: item.size })}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Remove item"
                            disabled={removeItem.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-1">
                          Size: {item.size}
                        </div>

                        {!item.inStock && (
                          <div className="text-xs text-destructive font-medium mt-1">
                            Quantity exceeds available stock
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-auto pt-2">
                          {/* Qty Controls */}
                          <div className="flex items-center border rounded-full overflow-hidden h-8 w-fit">
                            <button 
                              className="px-2.5 h-full hover:bg-muted transition-colors disabled:opacity-50"
                              onClick={() => updateQty.mutate({ productId: item.productId, size: item.size, qty: item.qty - 1 })}
                              disabled={updateQty.isPending}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                            <button 
                              className="px-2.5 h-full hover:bg-muted transition-colors disabled:opacity-50"
                              onClick={() => updateQty.mutate({ productId: item.productId, size: item.size, qty: item.qty + 1 })}
                              disabled={updateQty.isPending}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          
                          {/* Price */}
                          <div className="font-semibold">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: item.product?.currency || 'INR' }).format(item.lineTotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="p-6 border-t bg-muted/20">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-semibold text-lg">Subtotal</span>
                  <span className="font-bold text-xl">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: cart.items[0]?.product?.currency || 'INR' }).format(cart.subtotal)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Shipping and taxes calculated at checkout.
                </p>
                <Link href="/checkout" onClick={closeDrawer} className="w-full">
                  <Button size="lg" className="w-full rounded-full h-14 text-lg font-semibold">
                    Checkout
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
