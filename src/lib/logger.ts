/**
 * Centralized logging utility
 * In production, this can be configured to send logs to a logging service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.isDevelopment && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && { error: { message: error.message, stack: error.stack } }),
    };

    switch (level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(`[${timestamp}] DEBUG:`, message, context || '');
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(`[${timestamp}] INFO:`, message, context || '');
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(`[${timestamp}] WARN:`, message, context || '', error || '');
        break;
      case 'error':
        // eslint-disable-next-line no-console
        console.error(`[${timestamp}] ERROR:`, message, context || '', error || '');
        break;
    }

    // In production, you could send logs to a service like Sentry, LogRocket, etc.
    // if (level === 'error' && !this.isDevelopment) {
    //   // Send to error tracking service
    // }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }
}

export const logger = new Logger();
