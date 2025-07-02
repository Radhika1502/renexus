/**
 * Directory Restructuring Script for Renexus
 * 
 * This script implements the monorepo structure outlined in monorepo-structure.md
 * It creates the necessary directories and moves files to their new locations.
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// Root directory
const rootDir = path.resolve(__dirname, '../../');

// Create directory structure
const directories = [
  // Apps
  'apps/backend/api',
  'apps/backend/auth',
  'apps/backend/notifications',
  'apps/backend/tasks',
  'apps/frontend/web',
  
  // Packages
  'packages/database/src/models',
  'packages/database/src/migrations',
  'packages/shared/api-client/src',
  'packages/shared/config/src',
  'packages/shared/types/src',
  'packages/shared/utils/src',
  'packages/ui/src/components',
  'packages/ui/src/hooks',
  
  // Tools
  'tools/scripts',
  'tools/config',
  
  // Docs
  'docs',
  '.github'
];

// Migration mapping - source to destination
const migrations = [
  // Backend services
  { src: 'backend/api', dest: 'apps/backend/api' },
  { src: 'backend/auth-service', dest: 'apps/backend/auth' },
  { src: 'backend/notification-service', dest: 'apps/backend/notifications' },
  { src: 'backend/task-service', dest: 'apps/backend/tasks' },
  
  // Frontend
  { src: 'frontend/web', dest: 'apps/frontend/web' },
  
  // Shared packages
  { src: 'backend/database', dest: 'packages/database/src' },
  { src: 'shared/types', dest: 'packages/shared/types/src' },
  { src: 'shared/utils', dest: 'packages/shared/utils/src' },
  { src: 'shared/config', dest: 'packages/shared/config/src' },
  
  // Documentation
  { src: 'docs', dest: 'docs' }
];

// Files to update imports in
const filesToUpdateImports = [
  'apps/backend/**/*.ts',
  'apps/backend/**/*.js',
  'apps/frontend/**/*.ts',
  'apps/frontend/**/*.tsx',
  'apps/frontend/**/*.js',
  'apps/frontend/**/*.jsx',
  'packages/**/*.ts',
  'packages/**/*.tsx',
  'packages/**/*.js',
  'packages/**/*.jsx'
];

// Import path mappings - old to new
const importPathMappings = [
  { from: '@backend/api', to: '@apps/backend/api' },
  { from: '@backend/auth-service', to: '@apps/backend/auth' },
  { from: '@backend/notification-service', to: '@apps/backend/notifications' },
  { from: '@backend/task-service', to: '@apps/backend/tasks' },
  { from: '@frontend/web', to: '@apps/frontend/web' },
  { from: '@shared/types', to: '@packages/shared/types' },
  { from: '@shared/utils', to: '@packages/shared/utils' },
  { from: '@shared/config', to: '@packages/shared/config' },
  { from: '@database', to: '@packages/database' }
];

/**
 * Create directory structure
 */
function createDirectories() {
  console.log('Creating directory structure...');
  
  directories.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirpSync(fullPath);
      console.log(`Created directory: ${dir}`);
    }
  });
}

/**
 * Migrate files from old to new structure
 */
async function migrateFiles() {
  console.log('Migrating files...');
  
  for (const migration of migrations) {
    const srcPath = path.join(rootDir, migration.src);
    const destPath = path.join(rootDir, migration.dest);
    
    if (fs.existsSync(srcPath)) {
      try {
        await fs.copy(srcPath, destPath);
        console.log(`Migrated: ${migration.src} -> ${migration.dest}`);
      } catch (err) {
        console.error(`Error migrating ${migration.src}:`, err);
      }
    } else {
      console.warn(`Source directory not found: ${migration.src}`);
    }
  }
}

/**
 * Update import paths in files
 */
function updateImportPaths() {
  console.log('Updating import paths...');
  
  filesToUpdateImports.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: rootDir });
    
    files.forEach(file => {
      const filePath = path.join(rootDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;
      
      importPathMappings.forEach(mapping => {
        const regex = new RegExp(`from ['"]${mapping.from}(\\/[^'"]*)?['"]`, 'g');
        const newContent = content.replace(regex, (match, subPath) => {
          updated = true;
          return `from '${mapping.to}${subPath || ''}'`;
        });
        
        if (content !== newContent) {
          content = newContent;
        }
      });
      
      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated imports in: ${file}`);
      }
    });
  });
}

/**
 * Create package.json files for new packages
 */
function createPackageJsonFiles() {
  console.log('Creating package.json files...');
  
  const packageDirs = [
    'packages/database',
    'packages/shared/api-client',
    'packages/shared/config',
    'packages/shared/types',
    'packages/shared/utils',
    'packages/ui'
  ];
  
  packageDirs.forEach(dir => {
    const packagePath = path.join(rootDir, dir, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      const packageName = `@renexus/${dir.replace('packages/', '').replace('/', '-')}`;
      
      const packageJson = {
        name: packageName,
        version: '0.1.0',
        private: true,
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        scripts: {
          build: 'tsc',
          clean: 'rimraf dist',
          dev: 'tsc --watch',
          lint: 'eslint src --ext .ts,.tsx'
        },
        dependencies: {},
        devDependencies: {}
      };
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log(`Created package.json for: ${dir}`);
    }
  });
}

/**
 * Create root package.json for monorepo
 */
function createRootPackageJson() {
  console.log('Creating root package.json...');
  
  const rootPackagePath = path.join(rootDir, 'package.json');
  let rootPackage = {};
  
  if (fs.existsSync(rootPackagePath)) {
    rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
  }
  
  rootPackage.name = 'renexus';
  rootPackage.private = true;
  rootPackage.workspaces = [
    'apps/*',
    'packages/*',
    'packages/shared/*'
  ];
  
  if (!rootPackage.scripts) {
    rootPackage.scripts = {};
  }
  
  rootPackage.scripts.build = 'turbo run build';
  rootPackage.scripts.dev = 'turbo run dev';
  rootPackage.scripts.lint = 'turbo run lint';
  rootPackage.scripts.clean = 'turbo run clean';
  
  fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2));
  console.log('Updated root package.json');
}

/**
 * Create tsconfig.json files for new packages
 */
function createTsConfigFiles() {
  console.log('Creating tsconfig.json files...');
  
  const packageDirs = [
    'packages/database',
    'packages/shared/api-client',
    'packages/shared/config',
    'packages/shared/types',
    'packages/shared/utils',
    'packages/ui'
  ];
  
  packageDirs.forEach(dir => {
    const tsConfigPath = path.join(rootDir, dir, 'tsconfig.json');
    
    if (!fs.existsSync(tsConfigPath)) {
      const tsConfig = {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          outDir: './dist',
          rootDir: './src'
        },
        include: ['src/**/*']
      };
      
      fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
      console.log(`Created tsconfig.json for: ${dir}`);
    }
  });
}

/**
 * Create base tsconfig.json for monorepo
 */
function createBaseTsConfig() {
  console.log('Creating base tsconfig.json...');
  
  const baseTsConfigPath = path.join(rootDir, 'tsconfig.base.json');
  
  const baseTsConfig = {
    compilerOptions: {
      target: 'es2018',
      module: 'commonjs',
      declaration: true,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      paths: {
        '@apps/backend/*': ['apps/backend/*'],
        '@apps/frontend/*': ['apps/frontend/*'],
        '@packages/database': ['packages/database/src'],
        '@packages/shared/api-client': ['packages/shared/api-client/src'],
        '@packages/shared/config': ['packages/shared/config/src'],
        '@packages/shared/types': ['packages/shared/types/src'],
        '@packages/shared/utils': ['packages/shared/utils/src'],
        '@packages/ui': ['packages/ui/src']
      }
    }
  };
  
  fs.writeFileSync(baseTsConfigPath, JSON.stringify(baseTsConfig, null, 2));
  console.log('Created base tsconfig.json');
}

/**
 * Run the migration
 */
async function run() {
  try {
    console.log('Starting directory restructuring...');
    
    // Step 1: Create directory structure
    createDirectories();
    
    // Step 2: Migrate files
    await migrateFiles();
    
    // Step 3: Create package.json files
    createPackageJsonFiles();
    
    // Step 4: Create root package.json
    createRootPackageJson();
    
    // Step 5: Create tsconfig.json files
    createTsConfigFiles();
    
    // Step 6: Create base tsconfig.json
    createBaseTsConfig();
    
    // Step 7: Update import paths
    updateImportPaths();
    
    console.log('Directory restructuring completed successfully!');
  } catch (err) {
    console.error('Error during directory restructuring:', err);
  }
}

// Run the migration
run();
