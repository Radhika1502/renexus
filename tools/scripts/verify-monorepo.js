/**
 * Monorepo Verification Script
 * 
 * This script verifies that the monorepo restructuring was successful by:
 * 1. Checking that key files exist in the new structure
 * 2. Validating import paths in TypeScript/JavaScript files
 * 3. Ensuring package.json files are properly configured
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Root directory of the monorepo
const rootDir = path.resolve(__dirname, '../..');

// Define key files that should exist in the new structure
const keyFiles = [
  // Frontend files
  'apps/frontend/web/src/hooks/useOfflineSync.ts',
  'apps/frontend/web/src/services/api/offlineAwareClient.ts',
  'apps/frontend/web/src/services/tasks/offlineTaskService.ts',
  'apps/frontend/web/src/components/common/OfflineStatusNotification.tsx',
  'apps/frontend/web/src/components/layout/AppLayout.tsx',
  
  // Backend files
  'apps/backend/api/src/index.ts',
  'apps/backend/auth/src/index.ts',
  'apps/backend/tasks/src/index.ts',
  
  // Shared packages
  'packages/shared/types/index.ts',
  'packages/shared/utils/index.ts',
  'packages/ui/index.ts',
  
  // Configuration files
  'package.json',
  'tsconfig.json',
  'docs/monorepo-structure.md'
];

// Check if key files exist
function checkKeyFiles() {
  console.log('Checking key files...');
  
  const missingFiles = [];
  const existingFiles = [];
  
  for (const file of keyFiles) {
    const filePath = path.join(rootDir, file);
    
    if (fs.existsSync(filePath)) {
      existingFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }
  
  console.log(`\nFound ${existingFiles.length} of ${keyFiles.length} key files`);
  
  if (existingFiles.length > 0) {
    console.log('\nExisting key files:');
    existingFiles.forEach(file => console.log(`✓ ${file}`));
  }
  
  if (missingFiles.length > 0) {
    console.log('\nMissing key files:');
    missingFiles.forEach(file => console.log(`✗ ${file}`));
  }
  
  return {
    success: missingFiles.length === 0,
    existingFiles,
    missingFiles
  };
}

// Find all TypeScript/JavaScript files in the monorepo
function findSourceFiles() {
  console.log('\nFinding source files...');
  
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**']
  });
  
  console.log(`Found ${files.length} source files`);
  
  return files;
}

// Check for invalid import paths
function checkImportPaths(files) {
  console.log('\nChecking import paths...');
  
  const invalidImports = [];
  
  for (const file of files) {
    const filePath = path.join(rootDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const importLines = content.match(/import\s+.*?from\s+['"].*?['"]/g) || [];
      
      for (const importLine of importLines) {
        // Extract the import path
        const importPath = importLine.match(/from\s+['"](.+?)['"]/)[1];
        
        // Skip external packages and relative imports
        if (!importPath.startsWith('.') && !importPath.startsWith('@')) {
          continue;
        }
        
        // Check for old directory structure paths
        const oldPathPatterns = [
          /^frontend\/web\//,
          /^backend\//,
          /^shared\//
        ];
        
        for (const pattern of oldPathPatterns) {
          if (pattern.test(importPath)) {
            invalidImports.push({
              file,
              importPath,
              line: importLine
            });
            break;
          }
        }
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error.message);
    }
  }
  
  if (invalidImports.length > 0) {
    console.log('\nFound invalid import paths:');
    invalidImports.forEach(({ file, importPath, line }) => {
      console.log(`✗ ${file}: ${importPath}`);
    });
  } else {
    console.log('No invalid import paths found');
  }
  
  return {
    success: invalidImports.length === 0,
    invalidImports
  };
}

// Check package.json files
function checkPackageJsonFiles() {
  console.log('\nChecking package.json files...');
  
  const packageJsonFiles = glob.sync('**/package.json', {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
  
  console.log(`Found ${packageJsonFiles.length} package.json files`);
  
  const issues = [];
  
  // Check root package.json for workspaces
  try {
    const rootPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    
    if (!rootPackageJson.workspaces) {
      issues.push('Root package.json is missing workspaces configuration');
    } else {
      console.log(`✓ Root package.json has workspaces: ${rootPackageJson.workspaces.join(', ')}`);
    }
  } catch (error) {
    issues.push(`Error reading root package.json: ${error.message}`);
  }
  
  // Check package.json files in apps and packages
  for (const packageJsonFile of packageJsonFiles) {
    if (packageJsonFile === 'package.json') {
      continue; // Skip root package.json
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, packageJsonFile), 'utf8'));
      
      if (!packageJson.name) {
        issues.push(`${packageJsonFile} is missing name field`);
      }
      
      // Check for dependencies on other workspace packages
      const allDeps = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {})
      };
      
      for (const [dep, version] of Object.entries(allDeps)) {
        if (dep.startsWith('@apps/') || dep.startsWith('@packages/')) {
          if (!version.startsWith('workspace:')) {
            issues.push(`${packageJsonFile}: Dependency ${dep} should use workspace: protocol`);
          }
        }
      }
    } catch (error) {
      issues.push(`Error reading ${packageJsonFile}: ${error.message}`);
    }
  }
  
  if (issues.length > 0) {
    console.log('\nFound issues with package.json files:');
    issues.forEach(issue => console.log(`✗ ${issue}`));
  } else {
    console.log('No issues found with package.json files');
  }
  
  return {
    success: issues.length === 0,
    issues
  };
}

// Check tsconfig.json files
function checkTsConfigFiles() {
  console.log('\nChecking tsconfig.json files...');
  
  const tsconfigFiles = glob.sync('**/tsconfig.json', {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
  
  console.log(`Found ${tsconfigFiles.length} tsconfig.json files`);
  
  const issues = [];
  
  // Check root tsconfig.json for path aliases
  try {
    const rootTsconfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'tsconfig.json'), 'utf8'));
    
    if (!rootTsconfig.compilerOptions?.paths) {
      issues.push('Root tsconfig.json is missing path aliases');
    } else {
      console.log('✓ Root tsconfig.json has path aliases');
    }
  } catch (error) {
    issues.push(`Error reading root tsconfig.json: ${error.message}`);
  }
  
  if (issues.length > 0) {
    console.log('\nFound issues with tsconfig.json files:');
    issues.forEach(issue => console.log(`✗ ${issue}`));
  } else {
    console.log('No issues found with tsconfig.json files');
  }
  
  return {
    success: issues.length === 0,
    issues
  };
}

// Run all verification checks
function runVerification() {
  console.log('=== Monorepo Verification ===\n');
  
  const keyFilesResult = checkKeyFiles();
  const sourceFiles = findSourceFiles();
  const importPathsResult = checkImportPaths(sourceFiles);
  const packageJsonResult = checkPackageJsonFiles();
  const tsConfigResult = checkTsConfigFiles();
  
  console.log('\n=== Verification Summary ===');
  console.log(`Key Files: ${keyFilesResult.success ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Import Paths: ${importPathsResult.success ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Package JSON: ${packageJsonResult.success ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`TSConfig: ${tsConfigResult.success ? '✓ PASS' : '✗ FAIL'}`);
  
  const overallSuccess = 
    keyFilesResult.success && 
    importPathsResult.success && 
    packageJsonResult.success && 
    tsConfigResult.success;
  
  console.log(`\nOverall: ${overallSuccess ? '✓ PASS' : '✗ FAIL'}`);
  
  if (!overallSuccess) {
    console.log('\nRecommendations:');
    
    if (!keyFilesResult.success) {
      console.log('- Create the missing key files');
    }
    
    if (!importPathsResult.success) {
      console.log('- Update import paths to use the new monorepo structure');
    }
    
    if (!packageJsonResult.success) {
      console.log('- Fix issues with package.json files');
    }
    
    if (!tsConfigResult.success) {
      console.log('- Configure path aliases in tsconfig.json');
    }
  }
  
  return overallSuccess;
}

// Run the verification
runVerification();
