export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  namespace: string;
  minLevel?: LogLevel;
}

const LEVEL_WEIGHTS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class Logger {
  private namespace: string;
  private minLevel: LogLevel;

  constructor(options: LoggerOptions) {
    this.namespace = options.namespace;
    this.minLevel = options.minLevel || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_WEIGHTS[level] >= LEVEL_WEIGHTS[this.minLevel];
  }

  private format(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message), ...args);
    }
  }
}

export function createLogger(namespace: string, minLevel?: LogLevel): Logger {
  return new Logger({ namespace, minLevel });
}

