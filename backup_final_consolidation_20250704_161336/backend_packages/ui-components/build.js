const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Cleaning dist directory...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

console.log('Compiling TypeScript...');
try {
  console.log('Running TypeScript compiler...');
  const result = execSync('npx tsc --project tsconfig.json --noEmit false --pretty', { stdio: 'pipe' });
  console.log('TypeScript output:', result.toString());
  
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    console.log('Dist directory contents:', fs.readdirSync(path.join(__dirname, 'dist')));
  } else {
    console.log('Dist directory does not exist after compilation');
  }
  
  console.log('TypeScript compilation completed!');
  
  // Copy package.json
  const pkg = require('./package.json');
  const { scripts, devDependencies, ...rest } = pkg;
  fs.writeFileSync(
    path.join(distPath, 'package.json'),
    JSON.stringify({
      ...rest,
      main: 'index.js',
      module: 'index.mjs',
      types: 'index.d.ts',
    }, null, 2)
  );
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
