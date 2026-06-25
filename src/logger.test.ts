import logger, { Logger, setLogger, resetLogger, noopLogger } from './logger';

describe('Logger', () => {
  let consoleInfoStub: ReturnType<typeof vi.spyOn>;
  let consoleDebugStub: ReturnType<typeof vi.spyOn>;
  let consoleWarnStub: ReturnType<typeof vi.spyOn>;
  let consoleErrorStub: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Replace console methods with stubs
    consoleInfoStub = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugStub = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleWarnStub = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorStub = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original console methods
    consoleInfoStub.mockRestore();
    consoleWarnStub.mockRestore();
    consoleErrorStub.mockRestore();
    consoleDebugStub.mockRestore();
  });

  describe('info', () => {
    it('should call console.log with properly formatted message', () => {
      const message = 'Information test';
      logger.info(message);
      expect(consoleInfoStub).toHaveBeenCalledOnce();
      const loggedMessage = consoleInfoStub.mock.calls[0][0];
      // Basic format checks
      expect(loggedMessage).toContain('[INFO]');
      expect(loggedMessage).toContain('[NODE-CRON]');
      expect(loggedMessage).toContain(message);
    });
  });

  describe('warn', () => {
    it('should call console.warn with properly formatted message', () => {
      const message = 'Warning test';
      logger.warn(message);
      expect(consoleWarnStub).toHaveBeenCalledOnce();
      const loggedMessage = consoleWarnStub.mock.calls[0][0];
      expect(loggedMessage).toContain('[WARN]');
      expect(loggedMessage).toContain('[NODE-CRON]');
      expect(loggedMessage).toContain(message);
    });
  });

  describe('error', () => {
    it('should call console.error with properly formatted message when passed string', () => {
      const message = 'Error test';
      logger.error(message);
      expect(consoleErrorStub).toHaveBeenCalledOnce();
      const loggedMessage = consoleErrorStub.mock.calls[0][0];
      expect(loggedMessage).toContain('[ERROR]');
      expect(loggedMessage).toContain('[NODE-CRON]');
      expect(loggedMessage).toContain(message);
    });

    it('should call console.error with properly formatted message when passed Error object', () => {
      const error = new Error('Error object test');
      logger.error(error);
      expect(consoleErrorStub).toHaveBeenCalledOnce();
      const loggedMessage = consoleErrorStub.mock.calls[0][0];
      const loggedError = consoleErrorStub.mock.calls[0][1];
      expect(loggedMessage).toContain('[ERROR]');
      expect(loggedMessage).toContain('[NODE-CRON]');
      expect(loggedMessage).toContain(error.message);
      expect(loggedError).toBe(error);
    });

    it('should call console.error with properly formatted message and additional error', () => {
      const message = 'Primary error message';
      const additionalError = new Error('Additional error details');
      logger.error(message, additionalError);
      expect(consoleErrorStub).toHaveBeenCalledOnce();
      const loggedMessage = consoleErrorStub.mock.calls[0][0];
      const loggedError = consoleErrorStub.mock.calls[0][1];
      expect(loggedMessage).toContain('[ERROR]');
      expect(loggedMessage).toContain('[NODE-CRON]');
      expect(loggedMessage).toContain(message);
      expect(loggedError).toBe(additionalError);
    });
  });

  describe('debug', () => {
    it('should call console.log with properly formatted message when passed string', () => {
      const message = 'Debug test';
      logger.debug(message);
      expect(consoleDebugStub).toHaveBeenCalledOnce();
      const loggedMessage = consoleDebugStub.mock.calls[0][0];
      expect(loggedMessage).toContain('[DEBUG]');
      expect(loggedMessage).toContain('[NODE-CRON]');
      expect(loggedMessage).toContain(message);
    });

    it('should call console.log with properly formatted message when passed Error object', () => {
      const error = new Error('Debug error test');
      logger.debug(error);
      expect(consoleDebugStub).toHaveBeenCalledOnce();
      const loggedMessage = consoleDebugStub.mock.calls[0][0];
      const loggedError = consoleDebugStub.mock.calls[0][1];
      expect(loggedMessage).toContain('[DEBUG]');
      expect(loggedMessage).toContain('[NODE-CRON]');
      expect(loggedMessage).toContain(error.message);
      expect(loggedError).toBe(error);
    });

    it('should call console.log with properly formatted message and additional error', () => {
      const message = 'Primary debug message';
      const additionalError = new Error('Additional debug details');
      logger.debug(message, additionalError);
      expect(consoleDebugStub).toHaveBeenCalledOnce();
      const loggedMessage = consoleDebugStub.mock.calls[0][0];
      const loggedError = consoleDebugStub.mock.calls[0][1];
      expect(loggedMessage).toContain('[DEBUG]');
      expect(loggedMessage).toContain('[NODE-CRON]');
      expect(loggedMessage).toContain(message);
      expect(loggedError).toBe(additionalError);
    });
  });

  describe('setLogger / resetLogger', () => {
    afterEach(() => resetLogger());

    function fakeLogger(): Logger & { calls: Record<string, any[][]> } {
      const calls: Record<string, any[][]> = { info: [], warn: [], error: [], debug: [] };
      return {
        calls,
        info: (...a: any[]) => { calls.info.push(a); },
        warn: (...a: any[]) => { calls.warn.push(a); },
        error: (...a: any[]) => { calls.error.push(a); },
        debug: (...a: any[]) => { calls.debug.push(a); },
      };
    }

    it('routes all calls to a custom logger and not to the console', () => {
      const custom = fakeLogger();
      setLogger(custom);

      logger.info('i');
      logger.warn('w');
      logger.error('e');
      logger.debug('d');

      expect(custom.calls.info).toEqual([['i']]);
      expect(custom.calls.warn).toEqual([['w']]);
      expect(custom.calls.error.length).toBe(1);
      expect(custom.calls.debug.length).toBe(1);
      expect(consoleInfoStub).not.toHaveBeenCalled();
      expect(consoleWarnStub).not.toHaveBeenCalled();
      expect(consoleErrorStub).not.toHaveBeenCalled();
    });

    it('resetLogger restores the default console logger', () => {
      setLogger(fakeLogger());
      resetLogger();

      logger.warn('back to console');
      expect(consoleWarnStub).toHaveBeenCalledOnce();
    });

    it('falls back to the default logger when set to a nullish value', () => {
      setLogger(undefined as any);
      logger.warn('still works');
      expect(consoleWarnStub).toHaveBeenCalledOnce();
    });

    it('noopLogger swallows everything', () => {
      setLogger(noopLogger);

      logger.info('x');
      logger.warn('x');
      logger.error('x');
      logger.debug('x');

      expect(consoleInfoStub).not.toHaveBeenCalled();
      expect(consoleWarnStub).not.toHaveBeenCalled();
      expect(consoleErrorStub).not.toHaveBeenCalled();
      expect(consoleDebugStub).not.toHaveBeenCalled();
    });
  });

  describe('log function', () => {
    it('should correctly format timestamp and process ID', () => {
      const message = 'Timestamp test';
      logger.info(message);
      expect(consoleInfoStub).toHaveBeenCalledOnce();
      const loggedMessage = consoleInfoStub.mock.calls[0][0];
      // Check for timestamp and PID format
      expect(loggedMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/); // ISO timestamp format
      expect(loggedMessage).toMatch(/\[PID: \d+\]/); // Process ID format
    });

    it('should use correct colors for different log levels', () => {
      // This is a limited test since we can't easily check ANSI color codes in the output
      // But we can at least ensure the log function is called correctly
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      logger.debug('Debug message');
      expect(consoleInfoStub).toHaveBeenCalledOnce();
      expect(consoleWarnStub).toHaveBeenCalledOnce();
      expect(consoleErrorStub).toHaveBeenCalledOnce();
      expect(consoleDebugStub).toHaveBeenCalledOnce();
    });
  });
});
