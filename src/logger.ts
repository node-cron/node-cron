type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

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
  const color = levelColors[level] ?? '';
  const prefix = `[${timestamp}] [PID: ${process.pid}] ${GREEN}[NODE-CRON]${GREEN} ${color}[${level}]${RESET}`;
  const output = `${prefix} ${message}`;

  switch (level) {
    case 'ERROR':
      console.error(output, extra ?? '');
      break;
    case 'WARN':
      console.warn(output);
      break;
    case 'INFO':
    default:
      console.log(output);
      break;
  }
}

const logger = {
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

export default logger;
