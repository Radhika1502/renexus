import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname);
const distDir = path.join(rootDir, 'dist');
const srcDir = path.join(rootDir, 'src');

// Clean dist directory
console.log('Cleaning dist directory...');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Compile TypeScript
try {
  console.log('Compiling TypeScript...');
  execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });
  
  // Create package.json in dist
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
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
