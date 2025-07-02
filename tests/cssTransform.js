/**
 * CSS Transform for Jest
 * Used to handle CSS imports in test files
 */
module.exports = {
  process() {
    return 'module.exports = {};';
  },
  getCacheKey() {
    return 'cssTransform';
  },
};
