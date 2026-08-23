'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AiStylistDemo() {
  return (
    <section className="py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Your personal stylist, available whenever you need it.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Stop wondering what to wear. Simply tell the AI about your upcoming event, mood, or budget. It instantly understands the context and builds a complete, cohesive look just for you.
            </p>
            <Link href="/chat" className="inline-flex items-center text-primary font-semibold hover:opacity-80 transition-opacity">
              Ask Your AI Stylist <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>

          {/* Visual Demo */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl border bg-card shadow-2xl overflow-hidden flex flex-col h-[500px]">
              {/* Chat Header */}
              <div className="h-16 border-b flex items-center px-6 gap-3 bg-muted/30">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="font-semibold text-sm">Occasia AI</div>
              </div>
              
              {/* Chat Body */}
              <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="self-end max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-5 py-3 text-sm"
                >
                  What should I wear for a dinner date in Mumbai tonight?
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.5 }}
                  className="self-start max-w-[90%] bg-muted rounded-2xl rounded-tl-none p-5 text-sm space-y-4"
                >
                  <p>Let&apos;s build something sharp but effortless for Mumbai&apos;s evening weather.</p>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="rounded-xl overflow-hidden border bg-background aspect-square relative">
                      <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center text-xs text-muted-foreground font-medium">Linen Shirt</div>
                    </div>
                    <div className="rounded-xl overflow-hidden border bg-background aspect-square relative">
                      <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center text-xs text-muted-foreground font-medium">Chinos</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Decorative background blur */}
            <div className="absolute -inset-4 -z-10 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-2xl rounded-3xl opacity-50" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
