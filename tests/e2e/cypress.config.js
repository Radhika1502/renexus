/**
 * Cypress Configuration for End-to-End Testing
 * Phase 5.1.3 - End-to-End Testing
 */
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'tests/e2e/specs/**/*.{js,jsx,ts,tsx}',
    supportFile: 'tests/e2e/support/e2e.js',
    fixturesFolder: 'tests/e2e/fixtures',
    screenshotsFolder: 'tests/e2e/screenshots',
    videosFolder: 'tests/e2e/videos',
    downloadsFolder: 'tests/e2e/downloads',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 50000,
    video: true,
    screenshotOnRunFailure: true,
    experimentalStudio: false,
    testIsolation: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      // Register plugins and custom tasks
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
        // Database reset task
        resetDatabase() {
          return null; // Actual implementation would reset the test database
        },
        // Seed test data
        seedTestData(data) {
          console.log('Seeding test data:', data);
          return null; // Actual implementation would seed test data
        }
      });
      
      return config;
    },
  },
  
  // Component testing config
  component: {
    specPattern: 'tests/e2e/component/**/*.cy.{js,jsx,ts,tsx}',
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
  
  // Environment variables
  env: {
    apiUrl: 'http://localhost:8000/api',
    adminEmail: 'admin@renexus.com',
    adminPassword: 'TestPassword123!',
    userEmail: 'user@renexus.com',
    userPassword: 'TestPassword123!',
  },
});
