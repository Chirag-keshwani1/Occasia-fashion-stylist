'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, RefreshCw } from 'lucide-react';
import { VideoShowcase } from './VideoShowcase';
import { APP_CONFIG } from '@/lib/constants/config';

export function VirtualTryOnSection() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 relative rounded-3xl overflow-hidden shadow-2xl border aspect-[4/5] max-h-[700px]"
          >
            <VideoShowcase 
              src={APP_CONFIG.LANDING_VIDEOS.VIRTUAL_TRY_ON} 
              className="w-full h-full"
              fallbackGradient="from-pink-500/10 to-orange-500/10"
            />
            
            {/* Overlay UI Mockup */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
              <div className="flex justify-between items-center">
                <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  AI Processing
                </div>
              </div>
              <div className="flex justify-center mb-10">
                <div className="bg-background/80 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 shadow-xl">
                  <Camera className="text-muted-foreground" />
                  <div className="h-8 w-px bg-border"></div>
                  <RefreshCw className="text-muted-foreground" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="order-1 lg:order-2 space-y-8"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-sm font-medium">
              Coming Soon
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              See it on yourself before you buy.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Upload a photo and let our advanced diffusion models show you exactly how the garment fits and drapes on your body type. No more guessing if it will look good on you.
            </p>
            
            <div className="space-y-4 pt-4">
              {[
                "Preserves your unique body shape",
                "Accurate fabric draping and lighting",
                "Works with multiple layers"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span className="font-medium text-foreground/80">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
