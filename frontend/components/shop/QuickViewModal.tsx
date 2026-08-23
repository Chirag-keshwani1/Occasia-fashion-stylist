'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useQuickViewStore } from '@/store/useQuickViewStore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function QuickViewModal() {
  const { isOpen, product, close } = useQuickViewStore();

  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 flex flex-col md:flex-row w-full max-w-4xl bg-background rounded-3xl overflow-hidden shadow-2xl border border-border"
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={close}
            className="absolute top-4 right-4 z-20 rounded-full bg-background/50 backdrop-blur-md"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Image Section */}
          <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto bg-muted">
            {product.images && product.images.length > 0 && product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col p-6 md:p-8 w-full md:w-1/2 overflow-y-auto max-h-[70vh]">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {product.brand}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              {product.name}
            </h2>
            <div className="text-xl font-semibold mb-6">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency }).format(product.price)}
            </div>

            <p className="text-muted-foreground mb-8">
              {product.description || 'No description available for this product.'}
            </p>

            <div className="mt-auto flex flex-col gap-3">
              <Link href={`/product/${product._id}`} onClick={close} passHref>
                <Button size="lg" className="rounded-full w-full">
                  View Full Details
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
