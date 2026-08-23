'use client';

import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { usePathname } from 'next/navigation';

export function ChatFAB() {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  // Don't show the FAB if the user is already on the chat page, login page, or not authenticated
  if (!isAuthenticated || pathname === '/chat' || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href="/chat">
        <Button 
          size="lg" 
          className="rounded-full h-16 w-16 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          aria-label="Chat with our AI Stylist"
        >
          <MessageSquareText className="h-7 w-7" />
        </Button>
      </Link>
    </div>
  );
}
