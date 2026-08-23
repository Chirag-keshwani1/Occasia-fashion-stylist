'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FinalCTA() {
  return (
    <section className="py-32 relative overflow-hidden bg-foreground text-background">
      {/* Cinematic subtle background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl space-y-8"
        >
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">
            Stop wondering what to wear.
          </h2>
          <p className="text-xl md:text-2xl text-background/70">
            Let your AI stylist build your next look.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8">
            <Link href="/outfits">
              <Button size="lg" className="h-14 px-8 rounded-full text-base font-semibold bg-background text-foreground hover:bg-background/90">
                Try AI Stylist
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base font-semibold border-background/20 hover:bg-background/10 text-background">
                Explore Styles
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
