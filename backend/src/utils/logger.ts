import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.logging.level,
  // Avoid creating the pino-pretty worker transport in test runs — it leaves
  // a background worker thread open which prevents Jest from exiting cleanly.
  transport:
    config.logging.pretty && !config.isTest
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    env: config.env,
  },
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

// Provide a default export for modules that import the logger as default
export default logger;
