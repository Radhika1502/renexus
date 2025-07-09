import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@frontend/theme';

// Create a custom render function that includes providers
function render(ui: React.ReactElement, { route = '/', ...options } = {}) {
  window.history.pushState({}, 'Test page', route);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Mock service responses
export const mockServiceResponse = {
  success: (data: any) => Promise.resolve({ data, error: null }),
  error: (error: any) => Promise.reject({ error }),
};

// Mock API endpoints
export const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  Object.values(mockApi).forEach(mock => mock.mockReset());
});

// Custom hook testing utilities
export function renderHook<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options: { initialProps?: TProps } = {}
) {
  const { initialProps } = options;
  let result: { current: TResult };

  function TestComponent({ hookProps }: { hookProps: TProps }) {
    result = { current: hook(hookProps) };
    return null;
  }

  render(<TestComponent hookProps={initialProps as TProps} />);
  return { result };
}

// Common test data generators
export const testData = {
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  }),
  project: (overrides = {}) => ({
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    createdAt: new Date().toISOString(),
    ...overrides,
  }),
};

export * from '@testing-library/react';
export { render }; 