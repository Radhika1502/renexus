import { create } from 'zustand';

interface ErrorState {
  errors: Array<{
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    timestamp: number;
  }>;
  addError: (message: string, type?: 'error' | 'warning' | 'info') => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],

  addError: (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      errors: [
        ...state.errors,
        {
          id,
          message,
          type,
          timestamp: Date.now(),
        },
      ],
    }));

    // Automatically remove error after 5 seconds
    setTimeout(() => {
      set((state) => ({
        errors: state.errors.filter((error) => error.id !== id),
      }));
    }, 5000);
  },

  removeError: (id: string) => {
    set((state) => ({
      errors: state.errors.filter((error) => error.id !== id),
    }));
  },

  clearErrors: () => {
    set({ errors: [] });
  },
})); 