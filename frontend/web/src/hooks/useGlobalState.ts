import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GlobalState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  setAuth: (isAuthenticated: boolean, user: GlobalState['user']) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useGlobalState = create<GlobalState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      setAuth: (isAuthenticated, user) => set({ isAuthenticated, user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'global-state',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
); 