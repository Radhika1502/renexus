# Task Management Module Test Fixes

This document outlines the steps needed to fix all the failing tests in the Task Management Module.

## 1. Dependencies

Ensure these dependencies are installed:

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event identity-obj-proxy @babel/preset-env @babel/preset-react babel-jest ts-jest jest-environment-jsdom @adobe/css-tools
```

## 2. Jest Configuration

Update `jest.config.js` with the following content:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: ['@babel/preset-env', '@babel/preset-react']
    }]
  },
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }
  }
};
```

## 3. Setup Tests File

Update `src/setupTests.ts` with:

```typescript
// Import jest-dom with error handling
try {
  require('@testing-library/jest-dom');
} catch (e) {
  console.warn('Could not load @testing-library/jest-dom, some matchers may be unavailable');
}

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: new Headers(),
  })
);

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.IntersectionObserver = IntersectionObserverMock;

// Mock ResizeObserver
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = ResizeObserverMock;

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
```

## 4. Create File Mock

Create `__mocks__/fileMock.js` with:

```javascript
module.exports = "test-file-stub";
```

## 5. Create Test Utilities

Create `src/features/task-management/test-utils/TestWrapper.tsx` with:

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test QueryClient
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
  },
});

// Wrapper for tests that need React Query
export const renderWithQueryClient = (ui, options = {}) => {
  const queryClient = createTestQueryClient();
  
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>,
      options
    ),
    queryClient,
  };
};

// Mock drag and drop context for tests that need it
export const mockDragDropContext = () => {
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

// Common task data for tests
export const mockTaskData = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task',
  status: 'TODO',
  priority: 'MEDIUM',
  createdAt: '2025-06-20T10:00:00Z',
  updatedAt: '2025-06-21T14:30:00Z',
  assignees: [],
  reporter: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  },
  projectId: 'project-1',
};
```

## 6. Fix Individual Test Files

For each failing test file, update the imports to use the test utilities and ensure proper mocking:

1. Replace direct render calls with `renderWithQueryClient`
2. Use the mock data from test utilities
3. Ensure all required providers are in place

## 7. Running Tests

Run tests with:

```bash
npx jest src/features/task-management/components/__tests__/BasicTest.test.tsx --no-cache
```

Then gradually add more test files as they are fixed.
