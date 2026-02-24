export function isTestEnvironment(): boolean {
  const lifecycleEvent = process.env.npm_lifecycle_event;
  if (lifecycleEvent && lifecycleEvent.startsWith('test')) {
    return true;
  }

  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  return false;
}

export function shouldLogRuntimeErrors(): boolean {
  if (process.env.NODE_CRON_LOG_ERRORS === 'true') {
    return true;
  }

  return !isTestEnvironment();
}
