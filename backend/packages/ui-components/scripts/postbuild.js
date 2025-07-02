const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

// Ensure dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create package.json in dist directory
const distPkg = {
  name: pkg.name,
  version: pkg.version,
  main: 'index.js',
  module: 'index.js',
  types: 'index.d.ts',
  private: false,
  files: ['**/*'],
  scripts: {},
  dependencies: pkg.dependencies || {},
  peerDependencies: pkg.peerDependencies || {}
};

const packageJsonPath = path.join(distDir, 'package.json');
fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(distPkg, null, 2)
);

console.log(`Generated ${packageJsonPath}`);
