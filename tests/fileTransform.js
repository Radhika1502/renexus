/**
 * File Transform for Jest
 * Used to handle file imports in test files
 */
const path = require('path');

module.exports = {
  process(src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));
    return `module.exports = ${assetFilename};`;
  },
  getCacheKey() {
    return 'fileTransform';
  },
};
