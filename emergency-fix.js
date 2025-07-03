#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

console.log('🚨 EMERGENCY FIX - STARTING SIMPLE SERVER');
console.log('========================================\n');

// Create minimal server
const minimalServer = `import { NestFactory } from '@nestjs/core';
import { Logger, Module, Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('api/health')
  apiHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('dashboard/summary')
  dashboardSummary() {
    return {
      activeProjects: 5,
      completedProjects: 12,
      totalTasks: 48,
      completedTasks: 36,
      upcomingDeadlines: 3,
      teamMembers: 8
    };
  }
}

@Module({
  controllers: [AppController],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3001);
  console.log('✅ Server running on http://localhost:3001');
}

bootstrap();`;

fs.writeFileSync('./emergency-server.ts', minimalServer);
console.log('✅ Created emergency server');

console.log('🚀 Starting server...');
const server = spawn('npx', ['ts-node', 'emergency-server.ts'], {
  stdio: 'inherit',
  shell: true
});

process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});

// Check if server started after 3 seconds
setTimeout(() => {
  console.log('\n📝 Testing server in 2 seconds...');
  setTimeout(() => {
    execSync('curl http://localhost:3001/health', { stdio: 'inherit' });
  }, 2000);
}, 3000); 