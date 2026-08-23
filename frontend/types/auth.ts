export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  preferences?: { favoriteStyles?: string[] };
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  data: {
    user: User;
    accessToken?: string; // Depends on backend implementation (might be cookie only)
  };
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}
