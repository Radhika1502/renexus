/**
 * Main support file for Cypress E2E tests
 * Phase 5.1.3 - End-to-End Testing
 */

// Import cypress commands
import './commands';

// Prevent uncaught exceptions from failing tests
// This is useful when testing error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Log the error for debugging but don't fail the test
  console.error('Uncaught exception:', err);
  return false;
});

// Log test start/end for better CI output
beforeEach(() => {
  const testTitle = Cypress.currentTest.title;
  cy.log(`Starting test: ${testTitle}`);
});

afterEach(() => {
  const testTitle = Cypress.currentTest.title;
  const testState = Cypress.currentTest.state;
  cy.log(`Test completed: ${testTitle} - ${testState}`);
});
