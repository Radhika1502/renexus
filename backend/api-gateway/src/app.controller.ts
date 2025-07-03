import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is running',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Get('api/health')
  apiHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is running',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}
