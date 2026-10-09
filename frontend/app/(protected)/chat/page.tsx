import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatClient } from '@/components/shop/ChatClient';

export const metadata: Metadata = {
  title: 'AI Stylist Chat | Occasia',
  description: 'Chat with our AI stylist for personalized advice',
};

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <ChatClient />
      </Suspense>
    </div>
  );
}
