// Simple logger utility for shared use across services
class SimpleLogger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.context}] ${message}`;
  }

  log(message: string): void {
    console.log(this.formatMessage('LOG', message));
  }

  error(message: string, error?: any): void {
    console.error(this.formatMessage('ERROR', message));
    if (error) {
      console.error(error);
    }
  }

  warn(message: string): void {
    console.warn(this.formatMessage('WARN', message));
  }

  debug(message: string): void {
    console.debug(this.formatMessage('DEBUG', message));
  }

  verbose(message: string): void {
    console.log(this.formatMessage('VERBOSE', message));
  }
}

export const logger = new SimpleLogger('App');

export function createLogger(context: string): SimpleLogger {
  return new SimpleLogger(context);
}

export default logger; 