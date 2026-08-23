import { apiClient as api } from '../api/axios';
import { Product } from '@/types/product';

export interface OutfitContext {
  season?: string;
  occasion?: string;
  destination?: string;
  budget?: number;
  stylePreference?: string;
}

export interface OutfitItem {
  category: string;
  product: Product;
}

export interface OutfitResponse {
  outfitId: string;
  styleName: string;
  context: OutfitContext;
  items: OutfitItem[];
  aiRationale: string;
  stylingTip: string;
}

export interface ChatSession {
  _id: string;
  userId: string;
  context: Record<string, unknown>;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

export const aiService = {
  // Outfits
  generateOutfit: async (context: OutfitContext) => {
    return api.post<{ data: { outfits: OutfitResponse[], count: number } }>('/outfits/generate', context);
  },

  parseAndGenerateOutfit: async (text: string) => {
    return api.post<{ data: { interpretedContext: OutfitContext, outfits: OutfitResponse[], count: number } }>('/outfits/parse-and-generate', { text });
  },

  saveOutfit: async (outfitId: string) => {
    return api.post(`/outfits/${outfitId}/save`);
  },

  getSavedOutfits: async () => {
    return api.get<{ data: { outfits: OutfitResponse[] } }>('/outfits/saved');
  },

  deleteOutfit: async (outfitId: string) => {
    return api.delete(`/outfits/${outfitId}`);
  },

  getOutfitItemAlternatives: async (outfitId: string) => {
    return api.get(`/outfits/${outfitId}/alternatives`);
  },

  // Chat
  createChatSession: async (outfitId?: string) => {
    return api.post<{ data: { session: ChatSession } }>('/chat/sessions', { outfitId });
  },

  getChatSessions: async () => {
    return api.get<{ data: { sessions: ChatSession[] } }>('/chat/sessions');
  },

  getChatSession: async (sessionId: string) => {
    return api.get<{ data: { session: ChatSession } }>(`/chat/sessions/${sessionId}`);
  },

  sendMessage: async (sessionId: string, message: string) => {
    return api.post<{ data: { message: ChatMessage, session: ChatSession } }>(`/chat/sessions/${sessionId}/messages`, { message });
  }
};
