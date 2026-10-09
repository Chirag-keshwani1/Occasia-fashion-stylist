'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/axios';
import { AxiosError } from 'axios';

interface VirtualTryOnModalProps {
  productId: string;
  category: string;
}

export function VirtualTryOnModal({ productId, category }: VirtualTryOnModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine if feature is supported
  const isSupported = ['top', 'bottom', 'outerwear'].includes(category.toLowerCase());

  if (!isSupported) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResultUrl(null);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;

    setIsGenerating(true);
    setError(null);
    setResultUrl(null);

    const formData = new FormData();
    formData.append('personImage', file);
    formData.append('productId', productId);
    try {
      const response = await apiClient.post('/tryon/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResultUrl(response.data.data.resultImageUrl);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{message: string}>;
      console.error('Try-on error:', axiosError);
      if (axiosError.response?.status === 429) {
        setError("You've reached the try-on limit for now — try again in a few minutes");
      } else if (axiosError.response?.status === 401) {
        setError("Please log in to use Virtual Try-On");
      } else {
        setError(axiosError.response?.data?.message || axiosError.message || 'An unexpected error occurred');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `occasia-tryon-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error('Failed to download image');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={<Button variant="secondary" className="w-full gap-2 rounded-full h-12 font-medium" />}
      >
        <Camera className="w-4 h-4" />
        Try It On (AI Preview)
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Virtual Try-On</DialogTitle>
          <DialogDescription>
            See how this {category} looks on you using our AI stylist.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {!resultUrl && !isGenerating && (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  For best results, upload a photo that is <strong>front-facing, full body</strong>, and has a <strong>plain background</strong>.
                </p>
              </div>

              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-muted/50 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewUrl ? (
                  <div className="space-y-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="mx-auto max-h-64 rounded-lg object-cover" />
                    <p className="text-sm text-muted-foreground font-medium">Click to change photo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium">Upload your photo</p>
                    <p className="text-sm text-muted-foreground">JPEG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              {previewUrl && (
                <Button className="w-full gap-2 mt-4" size="lg" onClick={handleGenerate}>
                  Generate Try-On
                </Button>
              )}
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div className="relative bg-primary/10 p-4 rounded-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">AI is fitting your garment...</h3>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                  This runs on a free AI model, it can take up to a minute to process. Please don&apos;t close this window.
                </p>
              </div>
            </div>
          )}

          {error && !isGenerating && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center space-y-4">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
              <div className="space-y-1">
                <h4 className="font-semibold text-destructive">Oops, something went wrong</h4>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
              <Button variant="outline" onClick={() => setError(null)} className="mt-2 w-full">
                Try Again
              </Button>
            </div>
          )}

          {resultUrl && !isGenerating && (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="relative rounded-xl overflow-hidden border bg-muted aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Try On Result" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => { setResultUrl(null); setFile(null); setPreviewUrl(null); }}>
                  Try Another Photo
                </Button>
                <Button className="flex-1 gap-2" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                  Save Result
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            AI-generated preview for styling reference — fit and drape may vary from the actual garment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
