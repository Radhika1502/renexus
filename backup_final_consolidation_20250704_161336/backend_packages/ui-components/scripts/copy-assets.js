const fs = require('fs');
const path = require('path');

// Copy any additional assets if needed
console.log('Copying assets...');

// Example: Copy CSS files if you have any
// fs.mkdirSync(path.join(__dirname, '../dist/styles'), { recursive: true });
// fs.copyFileSync(
//   path.join(__dirname, '../src/styles/index.css'),
//   path.join(__dirname, '../dist/styles/index.css')
// );

console.log('Build completed successfully!');
