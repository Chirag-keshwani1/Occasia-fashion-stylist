import { Metadata } from 'next';
import { ChatClient } from '@/components/shop/ChatClient';

export const metadata: Metadata = {
  title: 'AI Stylist Chat | Occasia',
  description: 'Chat with our AI stylist for personalized advice',
};

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      <ChatClient />
    </div>
  );
}
