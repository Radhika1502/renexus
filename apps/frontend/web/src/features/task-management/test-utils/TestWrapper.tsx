
import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test query client with default options
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
  },
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => {},
  },
});

// Wrapper component for testing with React Query
export const TestQueryClientProvider = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Helper function to render components with React Query
export const renderWithQueryClient = (ui, options = {}) => {
  const queryClient = createTestQueryClient();
  
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock for react-beautiful-dnd
export const createDragDropMocks = () => {
  jest.mock('react-beautiful-dnd', () => ({
    DragDropContext: ({ children }) => children,
    Droppable: ({ children }) => children({
      draggableProps: {
        style: {},
      },
      innerRef: jest.fn(),
    }),
    Draggable: ({ children }) => children({
      draggableProps: {
        style: {},
      },
      innerRef: jest.fn(),
      dragHandleProps: {},
    }),
  }));
};
