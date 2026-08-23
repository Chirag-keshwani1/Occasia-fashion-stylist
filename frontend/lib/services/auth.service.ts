import { apiClient } from '../api/axios';
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getProfile: async (): Promise<{ data: User }> => {
    const response = await apiClient.get('/users/me');
    return response.data; // assuming API returns { data: User }
  },

  supabaseSync: async (access_token: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/supabase-sync', { access_token });
    return response.data;
  },
};
