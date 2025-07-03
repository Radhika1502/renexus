import { NestFactory } from '@nestjs/core';
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

bootstrap();