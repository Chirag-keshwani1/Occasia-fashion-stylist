import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner'; // We will use sonner for toasts, shadcn provides it

import { ChatFAB } from '@/components/shared/ChatFAB';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    template: '%s | Occasia',
    default: 'Occasia - AI Powered Premium Fashion',
  },
  description: 'Premium AI Fashion Platform curating personalized outfits tailored to your unique taste, body type, and lifestyle.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen bg-background text-foreground flex flex-col font-sans`}>
        <Providers>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <ChatFAB />
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
