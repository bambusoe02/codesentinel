/**
 * Centralized logging utility
 * Logs are only shown in development, or can be sent to monitoring service in production
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private shouldLog(level: LogLevel): boolean {
    // Always log errors in production
    if (level === 'error') return true;
    // Only log other levels in development
    return this.isDevelopment;
  }

  private formatMessage(message: string, context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return message;
    }
    return `${message} ${JSON.stringify(context)}`;
  }

  log(message: string, context?: LogContext): void {
    if (this.shouldLog('log')) {
       
      console.log(this.formatMessage(message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
       
      console.info(this.formatMessage(message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
       
      console.warn(this.formatMessage(message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorContext = {
        ...context,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      };
      
       
      console.error(this.formatMessage(message, errorContext));
      
      // In production, send to error monitoring service
      if (!this.isDevelopment) {
        // TODO: Integrate with error monitoring service (e.g., Sentry, LogRocket)
        // logErrorToService(message, error, errorContext);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
       
      console.debug(this.formatMessage(message, context));
    }
  }
}

export const logger = new Logger();

