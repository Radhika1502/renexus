const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Cleaning dist directory...');
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

console.log('Compiling TypeScript...');
try {
  execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });
  
  // Copy package.json
  const pkg = require('../package.json');
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

  fs.writeFileSync(
    path.join(distDir, 'package.json'),
    JSON.stringify(distPkg, null, 2)
  );

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
