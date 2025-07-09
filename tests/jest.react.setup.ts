import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import { TextEncoder, TextDecoder } from 'util';

// Setup React Testing Library
configure({ 
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  eventWrapper: (cb) => act(async () => { await cb(); })
});

// Mock window.matchMedia
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

// Mock localStorage with persistent storage
const localStorageData = new Map();
const localStorageMock = {
  getItem: jest.fn((key) => localStorageData.get(key) || null),
  setItem: jest.fn((key, value) => localStorageData.set(key, value)),
  removeItem: jest.fn((key) => localStorageData.delete(key)),
  clear: jest.fn(() => localStorageData.clear()),
  length: jest.fn(() => localStorageData.size),
  key: jest.fn((index) => Array.from(localStorageData.keys())[index]),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage with persistent storage
const sessionStorageData = new Map();
const sessionStorageMock = {
  getItem: jest.fn((key) => sessionStorageData.get(key) || null),
  setItem: jest.fn((key, value) => sessionStorageData.set(key, value)),
  removeItem: jest.fn((key) => sessionStorageData.delete(key)),
  clear: jest.fn(() => sessionStorageData.clear()),
  length: jest.fn(() => sessionStorageData.size),
  key: jest.fn((index) => Array.from(sessionStorageData.keys())[index]),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  callback: IntersectionObserverCallback;
  observe = jest.fn((element: Element) => {
    this.callback([{
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRatio: 1,
      intersectionRect: element.getBoundingClientRect(),
      isIntersecting: true,
      rootBounds: null,
      target: element,
      time: Date.now()
    }], this);
  });
  unobserve = jest.fn();
  disconnect = jest.fn();
}
window.IntersectionObserver = IntersectionObserverMock;

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock requestAnimationFrame with act wrapper
global.requestAnimationFrame = (callback) => {
  return setTimeout(() => act(() => callback(Date.now())), 0);
};
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageData.clear();
  sessionStorageData.clear();
});

// Add custom matchers
expect.extend({
  toHaveBeenCalledAfter(received: jest.Mock, other: jest.Mock) {
    const receivedCalls = received.mock.invocationCallOrder;
    const otherCalls = other.mock.invocationCallOrder;
    
    if (receivedCalls.length === 0) {
      return {
        message: () => `expected mock to be called after other mock, but it was never called`,
        pass: false
      };
    }
    
    if (otherCalls.length === 0) {
      return {
        message: () => `expected mock to be called after other mock, but other mock was never called`,
        pass: false
      };
    }
    
    const pass = Math.min(...receivedCalls) > Math.max(...otherCalls);
    
    return {
      message: () => pass
        ? `expected mock not to be called after other mock`
        : `expected mock to be called after other mock`,
      pass
    };
  }
}); 