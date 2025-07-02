/**
 * Custom Test Sequencer for Regression Tests
 * Phase 5.2.3 - Regression Testing
 */
const Sequencer = require('@jest/test-sequencer').default;

/**
 * Custom sequencer to run tests in a specific order
 * to ensure dependencies are properly handled
 */
class RegressionTestSequencer extends Sequencer {
  /**
   * Sort test paths in desired order
   * @param {Array} tests - Array of test objects to sort
   * @returns {Array} - Sorted array of test objects
   */
  sort(tests) {
    // Define test execution order by path patterns
    const orderPriority = [
      // Critical path tests first
      /critical-path/,
      // Authentication related tests
      /auth/,
      // Core API functionality
      /api\/core/,
      // User related workflows
      /user/,
      // Project related workflows
      /project/,
      // Task related workflows
      /task/,
      // Integration flows
      /integration/,
      // User interface tests
      /ui/,
      // Edge cases and boundaries
      /edge-cases/,
      // Performance related tests
      /performance/
    ];

    // Create a copy of tests for sorting
    const sortedTests = [...tests];

    // Sort by priority patterns
    return sortedTests.sort((testA, testB) => {
      // Get the path strings
      const pathA = testA.path;
      const pathB = testB.path;

      // Find index of first matching pattern for each path
      const indexA = orderPriority.findIndex(pattern => pattern.test(pathA));
      const indexB = orderPriority.findIndex(pattern => pattern.test(pathB));

      // If both match patterns, sort by pattern priority
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // If only one matches a pattern, it comes first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // If neither matches a specific pattern, sort alphabetically
      return pathA.localeCompare(pathB);
    });
  }
}

module.exports = RegressionTestSequencer;
