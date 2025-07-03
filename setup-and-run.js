#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const os = require('os');

console.log('🔧 RENEXUS CRITICAL BUG FIX SCRIPT');
console.log('================================\n');

const projectRoot = process.cwd();

function createFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${filePath}`);
}

function runCommand(command, cwd = projectRoot) {
  console.log(`🔧 Running: ${command}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true 
    });
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚨 FIXING CRITICAL ISSUES...\n');

  // 1. Fix CacheModule import error in task-analytics.module.ts
  const taskAnalyticsModulePath = path.join(projectRoot, 'backend/api-gateway/src/features/task-analytics/task-analytics.module.ts');
  const fixedTaskAnalyticsModule = `import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TaskAnalyticsController } from './task-analytics.controller';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60, // Cache items for 60 seconds
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [TaskAnalyticsController],
  providers: [],
  exports: []
})
export class TaskAnalyticsModule {}
`;

  createFile(taskAnalyticsModulePath, fixedTaskAnalyticsModule);

  // 2. Create missing app.service.ts if it doesn't exist
  const appServicePath = path.join(projectRoot, 'backend/api-gateway/src/app.service.ts');
  if (!fs.existsSync(appServicePath)) {
    const appServiceContent = `import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Renexus API Gateway is running!';
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is healthy',
      uptime: process.uptime()
    };
  }
}
`;
    createFile(appServicePath, appServiceContent);
  }

  // 3. Fix cache.module.ts imports
  const cacheModulePath = path.join(projectRoot, 'backend/api-gateway/src/cache/cache.module.ts');
  const fixedCacheModule = `import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.register({
      ttl: 300, // 5 minutes
      max: 1000, // Maximum number of items in cache
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}
`;

  createFile(cacheModulePath, fixedCacheModule);

  // 4. Fix cache.service.ts imports
  const cacheServicePath = path.join(projectRoot, 'backend/api-gateway/src/cache/cache.service.ts');
  const fixedCacheService = `import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  async keys(): Promise<string[]> {
    return await this.cacheManager.store.keys();
  }
}
`;

  createFile(cacheServicePath, fixedCacheService);

  // 5. Ensure .env file exists
  const envPath = path.join(projectRoot, 'backend/api-gateway/.env');
  if (!fs.existsSync(envPath)) {
    const envContent = `NODE_ENV=development
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_SECRET=dev_jwt_secret_change_in_production
API_BASE_URL=http://localhost:3001/api
CORS_ORIGIN=http://localhost:3000
`;
    createFile(envPath, envContent);
  }

  // 6. Install dependencies if node_modules doesn't exist
  const nodeModulesPath = path.join(projectRoot, 'backend/api-gateway/node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('\n📦 Installing backend dependencies...');
    if (!runCommand('npm install', path.join(projectRoot, 'backend/api-gateway'))) {
      console.error('❌ Failed to install backend dependencies');
      return;
    }
  }

  // 7. Generate Prisma client
  console.log('\n🗄️ Setting up database...');
  if (!runCommand('npx prisma generate', path.join(projectRoot, 'backend/api-gateway'))) {
    console.error('❌ Failed to generate Prisma client');
    return;
  }

  if (!runCommand('npx prisma db push', path.join(projectRoot, 'backend/api-gateway'))) {
    console.error('❌ Failed to push database schema');
    return;
  }

  // 8. Start backend server
  console.log('\n🚀 Starting backend server...');
  const backendProcess = spawn('npm', ['run', 'start:dev'], {
    cwd: path.join(projectRoot, 'backend/api-gateway'),
    stdio: 'inherit',
    shell: true
  });

  // Wait a bit for backend to start
  setTimeout(() => {
    // 9. Start frontend server
    console.log('\n🌐 Starting frontend server...');
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(projectRoot, 'frontend/web'),
      stdio: 'inherit',
      shell: true
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });

    setTimeout(() => {
      console.log('\n✅ SETUP COMPLETE!');
      console.log('🌐 Frontend: http://localhost:3000');
      console.log('📡 Backend API: http://localhost:3001/api');
      console.log('🔍 Health Check: http://localhost:3001/api/health');
      console.log('📊 Dashboard: http://localhost:3000/dashboard');
      console.log('\n📝 Note: Both servers are now running. Press Ctrl+C to stop both.');
    }, 5000);

  }, 3000);
}

main().catch(console.error);