'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Play } from 'lucide-react';

interface VideoShowcaseProps {
  src: string;
  poster?: string;
  fallbackGradient?: string;
  className?: string;
  autoPlay?: boolean;
}

export function VideoShowcase({ src, poster, fallbackGradient = 'from-muted to-background', className = '', autoPlay = true }: VideoShowcaseProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (inView && autoPlay && !prefersReducedMotion) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked or error
      });
    } else {
      videoRef.current.pause();
    }
  }, [inView, autoPlay]);

  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${fallbackGradient} ${className}`}>
      {!error && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setError(true)}
        />
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-black/5 backdrop-blur-3xl">
          <Play className="h-12 w-12 opacity-20 mb-4" />
          <p className="text-sm font-medium tracking-widest uppercase opacity-50">Visual Demo</p>
        </div>
      )}
    </div>
  );
}
