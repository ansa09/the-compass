import { create } from 'zustand';
import { User, AuthResponse } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('compass_token'),
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.login({ email, password });
      localStorage.setItem('compass_token', response.token);
      set({ user: response.user, token: response.token, isAuthenticated: true });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  signup: async (email: string, password: string, name?: string) => {
    try {
      const response: AuthResponse = await authApi.signup({ email, password, name });
      localStorage.setItem('compass_token', response.token);
      set({ user: response.user, token: response.token, isAuthenticated: true });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('compass_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    const token = localStorage.getItem('compass_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response: { user: User } = await authApi.getMe();
      set({ user: response.user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      localStorage.removeItem('compass_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (user: User) => {
    set({ user });
  },
}));

// Initialize auth state on app load
useAuth.getState().refreshUser();
