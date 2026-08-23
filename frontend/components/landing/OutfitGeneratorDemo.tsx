'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { VideoShowcase } from './VideoShowcase';
import { APP_CONFIG } from '@/lib/constants/config';

export function OutfitGeneratorDemo() {
  const steps = [
    { label: "Occasion", value: "Dinner" },
    { label: "Style", value: "Smart Casual" },
    { label: "Color", value: "Neutral tones" },
    { label: "Budget", value: "Under ₹5,000" },
  ];

  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Generate looks instantly.
          </h2>
          <p className="text-lg text-muted-foreground">
            Tell us where you&apos;re going and what you like. We&apos;ll curate the perfect outfit by mixing and matching pieces from your favorite brands.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Step Sequence */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {steps.map((step, idx) => (
              <motion.div 
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                className="flex items-center gap-4 bg-background p-4 rounded-2xl border shadow-sm"
              >
                <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground w-20">
                  {step.label}
                </div>
                <div className="font-medium">
                  {step.value}
                </div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 }}
              className="flex justify-center py-2"
            >
              <ArrowDown className="text-muted-foreground animate-bounce" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 }}
              className="bg-primary text-primary-foreground p-4 rounded-2xl text-center font-semibold"
            >
              Generating Final Outfit...
            </motion.div>
          </div>

          {/* Video / Visual Result */}
          <motion.div 
            className="lg:col-span-8 lg:h-[600px]"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <VideoShowcase 
              src={APP_CONFIG.LANDING_VIDEOS.OUTFIT_GENERATOR} 
              className="w-full h-full min-h-[400px] shadow-2xl"
              fallbackGradient="from-indigo-500/10 to-purple-500/10"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
