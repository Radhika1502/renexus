#!/usr/bin/env node

/**
 * Deployment Script for Renexus Backend
 * 
 * This script prepares and deploys the Renexus backend API to a staging or production environment.
 * It runs tests, builds the application, and deploys it to the specified environment.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ENV_FILE = path.join(ROOT_DIR, '.env');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to run commands
function runCommand(command, description) {
  console.log(`\n🚀 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: ROOT_DIR
    });
    console.log(`✅ ${description} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed with the following error:`);
    console.error(error.message);
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log('Renexus Backend Deployment');
  console.log('=========================');
  
  // Ask for environment
  const environment = await new Promise((resolve) => {
    rl.question('\n📋 Select environment to deploy to (staging/production): ', (answer) => {
      resolve(answer.toLowerCase());
    });
  });
  
  if (environment !== 'staging' && environment !== 'production') {
    console.error('❌ Invalid environment. Please choose either "staging" or "production".');
    rl.close();
    process.exit(1);
  }
  
  console.log(`\n🌐 Deploying to ${environment} environment...`);
  
  // Check if .env file exists
  if (!fs.existsSync(ENV_FILE)) {
    console.error(`❌ Environment file not found at ${ENV_FILE}`);
    console.error('Please create a .env file with the required environment variables.');
    rl.close();
    process.exit(1);
  }
  
  // Run tests
  console.log('\n🧪 Running tests before deployment...');
  
  const unitTestsSuccess = runCommand('npm run test:unit', 'Unit tests');
  if (!unitTestsSuccess) {
    const proceed = await new Promise((resolve) => {
      rl.question('\n⚠️ Unit tests failed. Do you want to proceed with deployment? (y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (!proceed) {
      console.log('❌ Deployment aborted.');
      rl.close();
      process.exit(1);
    }
  }
  
  // Build the application
  console.log('\n🏗️ Building the application...');
  const buildSuccess = runCommand('npm run build', 'Build process');
  
  if (!buildSuccess) {
    console.error('❌ Build failed. Deployment aborted.');
    rl.close();
    process.exit(1);
  }
  
  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ Build directory not found at ${DIST_DIR}`);
    rl.close();
    process.exit(1);
  }
  
  // Run database migrations
  console.log('\n🗄️ Running database migrations...');
  const migrationsSuccess = runCommand('node scripts/run-migrations.js', 'Database migrations');
  
  if (!migrationsSuccess) {
    const proceed = await new Promise((resolve) => {
      rl.question('\n⚠️ Database migrations failed. Do you want to proceed with deployment? (y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });
    
    if (!proceed) {
      console.log('❌ Deployment aborted.');
      rl.close();
      process.exit(1);
    }
  }
  
  // Deploy to environment
  console.log(`\n🚀 Deploying to ${environment}...`);
  
  // Example deployment commands (replace with actual deployment commands)
  let deployCommand = '';
  
  if (environment === 'staging') {
    deployCommand = 'npm run deploy:staging';
  } else if (environment === 'production') {
    deployCommand = 'npm run deploy:production';
  }
  
  const deploySuccess = runCommand(deployCommand, `Deployment to ${environment}`);
  
  if (!deploySuccess) {
    console.error(`❌ Deployment to ${environment} failed.`);
    rl.close();
    process.exit(1);
  }
  
  console.log(`\n✅ Successfully deployed to ${environment}!`);
  
  // Summary
  console.log('\n📊 Deployment Summary');
  console.log('===================');
  console.log(`✅ Environment: ${environment}`);
  console.log(`✅ Unit Tests: ${unitTestsSuccess ? 'Passed' : 'Failed but proceeded'}`);
  console.log(`✅ Build: Successful`);
  console.log(`✅ Database Migrations: ${migrationsSuccess ? 'Successful' : 'Failed but proceeded'}`);
  console.log(`✅ Deployment: Successful`);
  
  console.log('\nNext steps:');
  console.log('1. Verify the application is running correctly');
  console.log('2. Check logs for any errors');
  console.log('3. Run smoke tests to ensure core functionality works');
  
  rl.close();
}

// Run the deployment
deploy().catch((error) => {
  console.error('❌ An unexpected error occurred during deployment:');
  console.error(error);
  rl.close();
  process.exit(1);
});
