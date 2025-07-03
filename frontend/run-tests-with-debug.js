/**
 * Enhanced Test Runner with Debug Information
 * 
 * This script runs tests with detailed debug information to help identify and fix issues.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const testPattern = process.argv[2] || 'src/features/task-management';
const debugMode = process.argv.includes('--debug');

console.log(`Running tests for: ${testPattern}`);
console.log('Debug mode:', debugMode ? 'ON' : 'OFF');

try {
  // Run Jest with verbose output
  const command = `npx jest ${testPattern} --verbose`;
  console.log(`Executing: ${command}`);
  
  const output = execSync(command, { 
    stdio: ['pipe', 'pipe', 'pipe'],
    encoding: 'utf-8'
  });
  
  console.log('Test execution completed successfully');
  console.log(output);
  
  // Write output to file for analysis
  fs.writeFileSync('test-debug-output.txt', output);
  console.log('Debug output saved to test-debug-output.txt');
  
} catch (error) {
  console.error('Test execution failed with error:');
  console.error(error.message);
  
  if (error.stdout) {
    console.log('\nTest output:');
    console.log(error.stdout);
    
    // Write error output to file for analysis
    fs.writeFileSync('test-debug-output.txt', error.stdout);
    console.log('Debug output saved to test-debug-output.txt');
  }
  
  if (error.stderr) {
    console.log('\nError output:');
    console.log(error.stderr);
  }
  
  // If in debug mode, print more information
  if (debugMode) {
    console.log('\nStack trace:');
    console.log(error.stack);
  }
  
  process.exit(1);
}
