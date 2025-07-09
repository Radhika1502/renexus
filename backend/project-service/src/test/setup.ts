import { cleanup } from '../db';

// Increase timeout for all tests
jest.setTimeout(10000);

// Ensure process exits after all tests
afterAll(async () => {
  await cleanup();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail the test suite if there are unhandled rejections
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Fail the test suite if there are uncaught exceptions
  process.exit(1);
}); 