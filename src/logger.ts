type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function log(level: LogLevel, message: string): void {
  const timestamp = new Date().toISOString();
  const output = `[${timestamp}] [NODE-CRON] [${level}] ${message}`;

  switch (level) {
    case 'ERROR':
      console.error(output);
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
  info(message: string){
    log('INFO', message);
  },
  warn(message: string){
    log('WARN', message);
  },
  error(message: string){
    log('ERROR', message);
  }
}

export default logger;