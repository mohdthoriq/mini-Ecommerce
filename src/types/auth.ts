// src/types/auth.ts
export interface AuthState {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
    phone?: string;
    address?: string;
    joinDate?: string;
    avatar?: string;
    // Additional fields from DummyJSON
    firstName?: string;
    lastName?: string;
    gender?: string;
    image?: string;
  };
}

export interface LoginForm {
  username: string;
  email: string;
  password: string;
}

export interface ApiResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
  loginMethod?: 'username' | 'email'; 
}
