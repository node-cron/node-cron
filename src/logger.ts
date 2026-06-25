type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * Logging interface used internally by node-cron. Provide your own
 * implementation via `setLogger` (globally) or the `logger` task option
 * (per task) to route node-cron logs through your application's logger.
 */
export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string | Error, err?: Error): void;
  debug(message: string | Error, err?: Error): void;
}

const levelColors: Record<LogLevel, string> = {
  INFO: '\x1b[36m',   // Cyan
  WARN: '\x1b[33m',   // Yellow
  ERROR: '\x1b[31m',  // Red
  DEBUG: '\x1b[35m',  // Magenta
};

const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

function log(level: LogLevel, message: string, extra?: any): void {
  const timestamp = new Date().toISOString();
  const color = levelColors[level];
  const prefix = `[${timestamp}] [PID: ${process.pid}] ${GREEN}[NODE-CRON]${GREEN} ${color}[${level}]${RESET}`;
  const output = `${prefix} ${message}`;

  switch (level) {
    case 'ERROR':
      console.error(output, extra ?? '');
      break;
    case 'DEBUG':
        console.debug(output, extra ?? '');
        break;
    case 'WARN':
      console.warn(output);
      break;
    case 'INFO':
    default:
      console.info(output);
      break;
  }
}

/**
 * The built-in console logger. Used by default unless replaced via `setLogger`.
 */
export const defaultLogger: Logger = {
  info(message: string) {
    log('INFO', message);
  },
  warn(message: string) {
    log('WARN', message);
  },
  error(message: string | Error, err?: Error) {
    if (message instanceof Error) {
      log('ERROR', message.message, message);
    } else {
      log('ERROR', message, err);
    }
  },
  debug(message: string | Error, err?: Error) {
    if (message instanceof Error) {
      log('DEBUG', message.message, message);
    } else {
      log('DEBUG', message, err);
    }
  },
};

/**
 * A logger that discards every message. Useful to silence node-cron entirely
 * and used internally by background tasks so logging happens in the parent
 * process (where the user's logger lives).
 */
export const noopLogger: Logger = {
  info() {},
  warn() {},
  error() {},
  debug() {},
};

let activeLogger: Logger = defaultLogger;

/**
 * Replaces the global logger used by node-cron. Pass `noopLogger` to silence
 * all output, or your own implementation to integrate with your app's logging.
 */
export function setLogger(logger: Logger): void {
  activeLogger = logger ?? defaultLogger;
}

/**
 * Restores the built-in console logger.
 */
export function resetLogger(): void {
  activeLogger = defaultLogger;
}

/**
 * Returns the currently active global logger.
 */
export function getLogger(): Logger {
  return activeLogger;
}

/**
 * Default export. Delegates to the active global logger so existing internal
 * call sites pick up `setLogger` overrides automatically.
 */
const logger: Logger = {
  info: (message) => activeLogger.info(message),
  warn: (message) => activeLogger.warn(message),
  error: (message, err) => activeLogger.error(message, err),
  debug: (message, err) => activeLogger.debug(message, err),
};

export default logger;
