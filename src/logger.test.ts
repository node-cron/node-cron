import { assert } from 'chai';
import sinon from 'sinon';
import logger, { Logger, setLogger, resetLogger, noopLogger } from './logger';

describe('Logger', () => {
  let consoleInfoStub: sinon.SinonStub;
  let consoleDebugStub: sinon.SinonStub;
  let consoleWarnStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    // Replace console methods with stubs
    consoleInfoStub = sinon.stub(console, 'info');
    consoleDebugStub = sinon.stub(console, 'debug');
    consoleWarnStub = sinon.stub(console, 'warn');
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    // Restore original console methods
    consoleInfoStub.restore();
    consoleWarnStub.restore();
    consoleErrorStub.restore();
    consoleDebugStub.restore();
  });

  describe('info', () => {
    it('should call console.log with properly formatted message', () => {
      const message = 'Information test';
      logger.info(message);
      assert.isTrue(consoleInfoStub.calledOnce);
      const loggedMessage = consoleInfoStub.firstCall.args[0];
      // Basic format checks
      assert.include(loggedMessage, '[INFO]');
      assert.include(loggedMessage, '[NODE-CRON]');
      assert.include(loggedMessage, message);
    });
  });

  describe('warn', () => {
    it('should call console.warn with properly formatted message', () => {
      const message = 'Warning test';
      logger.warn(message);
      assert.isTrue(consoleWarnStub.calledOnce);
      const loggedMessage = consoleWarnStub.firstCall.args[0];
      assert.include(loggedMessage, '[WARN]');
      assert.include(loggedMessage, '[NODE-CRON]');
      assert.include(loggedMessage, message);
    });
  });

  describe('error', () => {
    it('should call console.error with properly formatted message when passed string', () => {
      const message = 'Error test';
      logger.error(message);
      assert.isTrue(consoleErrorStub.calledOnce);
      const loggedMessage = consoleErrorStub.firstCall.args[0];
      assert.include(loggedMessage, '[ERROR]');
      assert.include(loggedMessage, '[NODE-CRON]');
      assert.include(loggedMessage, message);
    });

    it('should call console.error with properly formatted message when passed Error object', () => {
      const error = new Error('Error object test');
      logger.error(error);
      assert.isTrue(consoleErrorStub.calledOnce);
      const loggedMessage = consoleErrorStub.firstCall.args[0];
      const loggedError = consoleErrorStub.firstCall.args[1];
      assert.include(loggedMessage, '[ERROR]');
      assert.include(loggedMessage, '[NODE-CRON]');
      assert.include(loggedMessage, error.message);
      assert.strictEqual(loggedError, error);
    });

    it('should call console.error with properly formatted message and additional error', () => {
      const message = 'Primary error message';
      const additionalError = new Error('Additional error details');
      logger.error(message, additionalError);
      assert.isTrue(consoleErrorStub.calledOnce);
      const loggedMessage = consoleErrorStub.firstCall.args[0];
      const loggedError = consoleErrorStub.firstCall.args[1];
      assert.include(loggedMessage, '[ERROR]');
      assert.include(loggedMessage, '[NODE-CRON]');
      assert.include(loggedMessage, message);
      assert.strictEqual(loggedError, additionalError);
    });
  });

  describe('debug', () => {
    it('should call console.log with properly formatted message when passed string', () => {
      const message = 'Debug test';
      logger.debug(message);
      assert.isTrue(consoleDebugStub.calledOnce);
      const loggedMessage = consoleDebugStub.firstCall.args[0];
      assert.include(loggedMessage, '[DEBUG]');
      assert.include(loggedMessage, '[NODE-CRON]');
      assert.include(loggedMessage, message);
    });

    it('should call console.log with properly formatted message when passed Error object', () => {
      const error = new Error('Debug error test');
      logger.debug(error);
      assert.isTrue(consoleDebugStub.calledOnce);
      const loggedMessage = consoleDebugStub.firstCall.args[0];
      const loggedError = consoleDebugStub.firstCall.args[1];
      assert.include(loggedMessage, '[DEBUG]');
      assert.include(loggedMessage, '[NODE-CRON]');
      assert.include(loggedMessage, error.message);
      assert.strictEqual(loggedError, error);
    });

    it('should call console.log with properly formatted message and additional error', () => {
      const message = 'Primary debug message';
      const additionalError = new Error('Additional debug details');
      logger.debug(message, additionalError);
      assert.isTrue(consoleDebugStub.calledOnce);
      const loggedMessage = consoleDebugStub.firstCall.args[0];
      const loggedError = consoleDebugStub.firstCall.args[1];
      assert.include(loggedMessage, '[DEBUG]');
      assert.include(loggedMessage, '[NODE-CRON]');
      assert.include(loggedMessage, message);
      assert.strictEqual(loggedError, additionalError);
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

      assert.deepEqual(custom.calls.info, [['i']]);
      assert.deepEqual(custom.calls.warn, [['w']]);
      assert.equal(custom.calls.error.length, 1);
      assert.equal(custom.calls.debug.length, 1);
      assert.isTrue(consoleInfoStub.notCalled);
      assert.isTrue(consoleWarnStub.notCalled);
      assert.isTrue(consoleErrorStub.notCalled);
    });

    it('resetLogger restores the default console logger', () => {
      setLogger(fakeLogger());
      resetLogger();

      logger.warn('back to console');
      assert.isTrue(consoleWarnStub.calledOnce);
    });

    it('falls back to the default logger when set to a nullish value', () => {
      setLogger(undefined as any);
      logger.warn('still works');
      assert.isTrue(consoleWarnStub.calledOnce);
    });

    it('noopLogger swallows everything', () => {
      setLogger(noopLogger);

      logger.info('x');
      logger.warn('x');
      logger.error('x');
      logger.debug('x');

      assert.isTrue(consoleInfoStub.notCalled);
      assert.isTrue(consoleWarnStub.notCalled);
      assert.isTrue(consoleErrorStub.notCalled);
      assert.isTrue(consoleDebugStub.notCalled);
    });
  });

  describe('log function', () => {
    it('should correctly format timestamp and process ID', () => {
      const message = 'Timestamp test';
      logger.info(message);
      assert.isTrue(consoleInfoStub.calledOnce);
      const loggedMessage = consoleInfoStub.firstCall.args[0];
      // Check for timestamp and PID format
      assert.match(loggedMessage, /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/); // ISO timestamp format
      assert.match(loggedMessage, /\[PID: \d+\]/); // Process ID format
    });

    it('should use correct colors for different log levels', () => {
      // This is a limited test since we can't easily check ANSI color codes in the output
      // But we can at least ensure the log function is called correctly
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      logger.debug('Debug message');
      assert.isTrue(consoleInfoStub.calledOnce);
      assert.isTrue(consoleWarnStub.calledOnce);
      assert.isTrue(consoleErrorStub.calledOnce);
      assert.isTrue(consoleDebugStub.calledOnce);
    });
  });
});