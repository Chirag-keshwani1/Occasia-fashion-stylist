'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export function CompleteTheLookSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/20 overflow-hidden">
      <div className="container px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Complete the look.
          </h2>
          <p className="text-lg text-muted-foreground">
            Don&apos;t just buy a shirt. Discover exactly what pairs perfectly with it. Our AI connects pieces across brands to build cohesive outfits instantly.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            
            {/* Top / Main item */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative w-48 h-64 md:w-64 md:h-80 bg-background rounded-3xl border shadow-xl flex items-center justify-center overflow-hidden z-20"
            >
              <div className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Anchor Piece</div>
              <div className="absolute inset-0 bg-primary/5"></div>
            </motion.div>

            {/* Connecting lines / plus icon */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="hidden md:flex bg-background rounded-full p-2 shadow-sm border z-30"
            >
              <Plus className="text-muted-foreground h-6 w-6" />
            </motion.div>

            {/* Accessories / Bottoms stacked */}
            <div className="flex gap-4 md:gap-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.2 }}
                className="w-32 h-40 md:w-48 md:h-56 bg-background rounded-2xl border shadow-lg flex flex-col items-center justify-center p-4"
              >
                <div className="text-muted-foreground font-medium text-xs text-center">Matching<br/>Bottoms</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.4 }}
                className="w-32 h-40 md:w-48 md:h-56 bg-background rounded-2xl border shadow-lg flex flex-col items-center justify-center p-4 translate-y-8"
              >
                <div className="text-muted-foreground font-medium text-xs text-center">Matching<br/>Shoes</div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
