import { expect } from '@jest/globals';
import {
  toBeInTheDocument,
  toHaveStyle,
  toBeVisible,
  toHaveClass,
  toHaveAttribute,
  toHaveTextContent
} from '@testing-library/jest-dom/matchers';

// Extend Jest matchers with DOM-specific matchers
expect.extend({
  toBeInTheDocument,
  toHaveStyle,
  toBeVisible,
  toHaveClass,
  toHaveAttribute,
  toHaveTextContent
});

// Configure JSDOM environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Set up localStorage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Set up sessionStorage mock
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Extend Jest timeout for e2e tests
jest.setTimeout(60000); 