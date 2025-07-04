import { Injectable, OnModuleInit, OnModuleDestroy, Logger, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');
  
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: 'colorless',
    });

    // Log database queries in development mode
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }
  
  async onModuleInit() {
    try {
      this.logger.log('Connecting to the database...');
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from the database...');
    await this.$disconnect();
    this.logger.log('Disconnected from the database');
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Execute a simple query to check database connection
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error.stack);
      return false;
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    this.logger.log('Enabling application shutdown hooks');
    
    // Listen for shutdown signals
    process.on('beforeExit', async () => {
      this.logger.log('beforeExit hook triggered');
      await app.close();
    });
    
    return this;
  }
}
