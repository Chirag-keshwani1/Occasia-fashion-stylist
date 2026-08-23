'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiService, ChatSession, ChatMessage } from '@/lib/services/ai.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Bot, User, Clock, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function ChatClient() {
  const searchParams = useSearchParams();
  const outfitId = searchParams.get('outfitId');
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch all sessions for history sidebar
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: () => aiService.getChatSessions(),
  });

  const sessions = sessionsData?.data?.data?.sessions || [];

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: (oid?: string) => aiService.createChatSession(oid),
    onSuccess: (res) => {
      setActiveSessionId(res.data.data.session._id);
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] });
    }
  });

  // Automatically start a new session if outfitId is present or no sessions exist
  useEffect(() => {
    setTimeout(() => {
      if (outfitId && !activeSessionId && !createSessionMutation.isPending && !hasInitialized) {
        setHasInitialized(true);
        createSessionMutation.mutate(outfitId);
      } else if (sessions.length > 0 && !activeSessionId && !outfitId) {
        // Pick the most recent session
        setActiveSessionId(sessions[0]._id);
      } else if (sessions.length === 0 && !isLoadingSessions && !activeSessionId && !createSessionMutation.isPending) {
        createSessionMutation.mutate(undefined);
      }
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfitId, sessions.length, isLoadingSessions]);

  // Fetch active session messages
  const { data: activeSessionData, isLoading: isLoadingActiveSession } = useQuery({
    queryKey: ['chatSession', activeSessionId],
    queryFn: () => aiService.getChatSession(activeSessionId!),
    enabled: !!activeSessionId,
    refetchInterval: 5000, // Polling just in case, though standard is optimistic
  });

  const activeSession = activeSessionData?.data?.data?.session;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (msg: string) => aiService.sendMessage(activeSessionId!, msg),
    onMutate: async (msg) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['chatSession', activeSessionId] });
      const previousSession = queryClient.getQueryData<{ data: { session: ChatSession } }>(['chatSession', activeSessionId]);
      
      if (previousSession) {
        queryClient.setQueryData(['chatSession', activeSessionId], {
          ...previousSession,
          data: {
            ...previousSession.data,
            session: {
              ...previousSession.data.session,
              messages: [
                ...previousSession.data.session.messages,
                { role: 'user', content: msg, timestamp: new Date().toISOString() },
                { role: 'assistant', content: '...', timestamp: new Date().toISOString(), isTyping: true }
              ]
            }
          }
        });
      }
      return { previousSession };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['chatSession', activeSessionId], context?.previousSession);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSession', activeSessionId] });
    }
  });

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, sendMessageMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSessionId) return;
    sendMessageMutation.mutate(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Sidebar - History */}
      <div className="hidden md:flex flex-col w-80 border-r bg-muted/10 h-full">
        <div className="p-4 border-b bg-background/50 flex justify-between items-center shrink-0">
          <h2 className="font-semibold">Conversations</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => createSessionMutation.mutate(undefined)}
            disabled={createSessionMutation.isPending}
          >
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoadingSessions ? (
            <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-4">No recent conversations.</p>
          ) : (
            sessions.map((s: ChatSession) => (
              <button
                key={s._id}
                onClick={() => setActiveSessionId(s._id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl text-sm transition-colors",
                  activeSessionId === s._id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquareText className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {s.messages.length > 0 ? s.messages[0].content : 'New Conversation'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs opacity-70 ml-6">
                  <Clock className="h-3 w-3" />
                  {format(new Date(s.createdAt), 'MMM d, h:mm a')}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full bg-background relative">
        {(isLoadingActiveSession && !activeSession) || createSessionMutation.isPending ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !activeSession ? (
          <div className="flex-1 flex flex-col justify-center items-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p>Select or start a conversation</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
              {activeSession.messages.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center max-w-lg mx-auto">
                  <div className="bg-primary/10 p-4 rounded-full mb-6">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">I&apos;m your AI Stylist</h3>
                  <p className="text-muted-foreground">
                    {activeSession.context?.outfitSummary 
                      ? "Start by asking about your saved outfits, or say &quot;I need something to wear for a beach party.&quot;" 
                      : "Ask me anything about fashion, styling advice, or matching pieces."}
                  </p>
                </div>
              ) : (
                activeSession.messages.map((msg: ChatMessage, idx: number) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex gap-4 max-w-3xl",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 shrink-0 rounded-full flex items-center justify-center mt-1",
                      msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn(
                      "px-5 py-3 rounded-2xl",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted rounded-tl-sm prose prose-sm dark:prose-invert max-w-none"
                    )}>
                      {msg.isTyping ? (
                        <div className="flex gap-1 items-center h-5">
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed m-0">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} className="h-4 shrink-0" />
            </div>

            <div className="p-4 bg-background border-t shrink-0">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask for styling advice..."
                  className="pr-14 h-14 rounded-full bg-muted/50 border-muted focus-visible:ring-primary/50 text-base px-6"
                  disabled={sendMessageMutation.isPending || !activeSession}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="absolute right-2 h-10 w-10 rounded-full"
                  disabled={!inputText.trim() || sendMessageMutation.isPending || !activeSession}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
