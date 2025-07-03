import { Logger } from '@nestjs/common';

export const logger = new Logger('App');

export function createLogger(context: string) {
  return new Logger(context);
} 