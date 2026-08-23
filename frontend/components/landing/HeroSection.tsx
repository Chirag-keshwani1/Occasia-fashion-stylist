'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden bg-background">
      {/* Cinematic Background Treatment */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        {/* Subtle animated blurs */}
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-primary/5 blur-[100px]"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] rounded-full bg-secondary/5 blur-[120px]"
        />
      </div>

      <div className="relative z-10 container flex flex-col items-center text-center px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl space-y-8"
        >
          <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-medium backdrop-blur-md mb-4">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Occasia AI Fashion Tech
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1]">
            Your AI Stylist.<br />
            <span className="text-muted-foreground">Your Entire Wardrobe.</span>
          </h1>
          
          <p className="mx-auto max-w-[600px] text-lg md:text-xl text-muted-foreground leading-relaxed">
            Discover premium fashion across top brands, intelligently tailored to your unique taste, body type, and lifestyle.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/shop">
              <Button size="lg" className="h-14 px-8 rounded-full text-base font-semibold">
                Explore Styles
              </Button>
            </Link>
            <Link href="/outfits">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base font-semibold bg-background/50 backdrop-blur-md">
                Meet Your AI Stylist
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
