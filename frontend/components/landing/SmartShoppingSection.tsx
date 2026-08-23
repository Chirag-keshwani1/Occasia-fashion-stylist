'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { VideoShowcase } from './VideoShowcase';
import { APP_CONFIG } from '@/lib/constants/config';

export function SmartShoppingSection() {
  return (
    <section className="py-24 md:py-32 bg-muted/20">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Conversational Fashion Discovery.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Don&apos;t struggle with endless filters. Just describe what you&apos;re looking for in plain English. Our AI understands occasion, budget, weather, and style instantly.
            </p>
            
            <div className="bg-background border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <p className="text-sm font-medium italic text-foreground/80 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                &quot;I need something for a beach vacation under ₹8,000.&quot;
              </p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {['Occasion: Beach', 'Budget: < ₹8,000', 'Style: Casual', 'Color: Light/Neutral'].map(tag => (
                <div key={tag} className="text-xs font-semibold px-3 py-1 bg-muted rounded-full text-muted-foreground">
                  {tag}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl border aspect-video"
          >
            <VideoShowcase 
              src={APP_CONFIG.LANDING_VIDEOS.SMART_SHOPPING} 
              className="w-full h-full"
              fallbackGradient="from-blue-500/10 to-teal-500/10"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
