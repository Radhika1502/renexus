import { expect } from '@jest/globals';
import { toBeInTheDocument, toHaveStyle } from '@testing-library/jest-dom/matchers';

// Extend Jest matchers
expect.extend({
  toBeInTheDocument,
  toHaveStyle,
  // Add other matchers as needed
});

// Extend Jest timeout for integration tests
jest.setTimeout(30000); 