'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/5] bg-muted rounded-3xl flex items-center justify-center text-muted-foreground">
        No images available
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row-reverse gap-4 md:gap-6 lg:sticky lg:top-24 lg:h-fit">
      {/* Main Image */}
      <div className="flex-1 relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-muted group cursor-crosshair">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={imgError[currentIndex] || !images[currentIndex] ? '/placeholder-image.png' : images[currentIndex]}
              alt={`${productName} - Image ${currentIndex + 1}`}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              onError={() => setImgError(prev => ({ ...prev, [currentIndex]: true }))}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto scrollbar-none snap-x md:snap-y md:w-24 shrink-0">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative aspect-[4/5] w-20 md:w-full shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all",
                currentIndex === index ? "border-primary" : "border-transparent hover:opacity-80"
              )}
            >
              <Image
                src={imgError[index] || !image ? '/placeholder-image.png' : image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
                onError={() => setImgError(prev => ({ ...prev, [index]: true }))}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
