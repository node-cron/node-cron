type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function log(level: LogLevel, message: string, extra?: any): void {
  const timestamp = new Date().toISOString();
  const output = `[${timestamp}] [NODE-CRON] [${level}] ${message}`;

  switch (level) {
    case 'ERROR':
      console.error(output, extra);
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
  error(message: string | Error, error?: Error){
    if ( message instanceof Error){
      log('ERROR', '', message);
    } else {
      log('ERROR', message, error);
    }
  }
}

export default logger;