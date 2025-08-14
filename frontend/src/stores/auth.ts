import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, LoginCredentials, RegisterData, AuthUser, Center } from "@/types";
import { useCenterStore } from "./centerStore";

// Constantes locales
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    REGISTER: '/api/register',
    ME: '/api/me'
  }
};

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data'
};

// Cliente API simple
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004';

const apiClient = {
  post: async (endpoint: string, data: any) => {
    const response = await fetch(API_BASE_URL + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Request failed');
    }
    return response.json();
  },
  get: async (endpoint: string) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const response = await fetch(API_BASE_URL + endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Request failed');
    }
    return response.json();
  }
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  initializeCenterContext: (allCenters: Center[]) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true });
          
          const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
          
          if (response.access_token && response.user) {
            const token = response.access_token;
            const user: AuthUser = {
              ...response.user,
              access_token: token,
              permissions: response.permissions || []
            };
            
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            
            // Inicializar contexto de centro
            if (user.center && user.role) {
              useCenterStore.getState().initializeCenterContext(
                { center: user.center, role: user.role },
                response.centers || []
              );
            }
            
            return response;
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true });
          
          const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
          
          if (response.access_token && response.user) {
            const token = response.access_token;
            const user = response.user;
            
            localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Limpiar localStorage
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        
        // Limpiar estado de la store
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        
        // Limpiar también la persistencia de Zustand
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('center-store');
        
        // Reset center store
        useCenterStore.getState().setUserRole('viewer');
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          
          if (!token) {
            set({ isAuthenticated: false, user: null, token: null });
            return;
          }

          set({ isLoading: true });
          
          const user = await apiClient.get(API_ENDPOINTS.AUTH.ME);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token is invalid
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
        }
      },

      initializeCenterContext: (allCenters: Center[]) => {
        const currentUser = get().user;
        if (currentUser) {
          // Initialize center context when user logs in
          // This method is required by the interface but implementation
          // is handled by the centerStore
          console.log('🏢 Initializing center context for user:', currentUser.email);
        }
      },
    }),
    {
      name: STORAGE_KEYS.USER_DATA,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
