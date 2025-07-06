import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import { AuthProvider } from '../contexts/AuthContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';

// Create a custom render function that includes providers
function render(
  ui: React.ReactElement,
  {
    route = '/',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AuthProvider>
              <WebSocketProvider>
                {children}
              </WebSocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Create mock user data
export const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'admin',
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-03-01T00:00:00Z',
};

// Create mock auth token
export const mockToken = 'mock-jwt-token';

// Create mock WebSocket connection
export const mockWebSocket = {
  readyState: WebSocket.OPEN,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Create a function to wait for promises to resolve
export const waitForPromises = () => new Promise(resolve => setImmediate(resolve));

// Create a function to simulate user events with delay
export const simulateUserDelay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Create a function to mock file upload
export const createMockFile = (name: string, type: string, size: number) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Create a function to mock API response
export const createMockApiResponse = (data: any, status = 200) => {
  return {
    data,
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    statusText: status === 200 ? 'OK' : 'Error',
  };
};

// Create a function to mock API error
export const createMockApiError = (status = 500, message = 'Internal Server Error') => {
  const error = new Error(message);
  Object.assign(error, {
    response: {
      status,
      data: { message },
    },
  });
  return error;
};

// Create a function to mock local storage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); },
  };
};

// Create a function to mock intersection observer
export const mockIntersectionObserver = () => {
  const observe = jest.fn();
  const unobserve = jest.fn();
  const disconnect = jest.fn();

  window.IntersectionObserver = jest.fn(() => ({
    observe,
    unobserve,
    disconnect,
  }));

  return { observe, unobserve, disconnect };
};

// Create a function to mock resize observer
export const mockResizeObserver = () => {
  const observe = jest.fn();
  const unobserve = jest.fn();
  const disconnect = jest.fn();

  window.ResizeObserver = jest.fn(() => ({
    observe,
    unobserve,
    disconnect,
  }));

  return { observe, unobserve, disconnect };
};

// Export everything from @testing-library/react
export * from '@testing-library/react';
export { render }; 