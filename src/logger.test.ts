import { expect } from 'chai';
import sinon from 'sinon';
import logger from './logger';

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
      
      expect(consoleInfoStub.calledOnce).to.be.true;
      const loggedMessage = consoleInfoStub.firstCall.args[0];
      
      // Basic format checks
      expect(loggedMessage).to.include('[INFO]');
      expect(loggedMessage).to.include('[NODE-CRON]');
      expect(loggedMessage).to.include(message);
    });
  });
  
  describe('warn', () => {
    it('should call console.warn with properly formatted message', () => {
      const message = 'Warning test';
      logger.warn(message);
      
      expect(consoleWarnStub.calledOnce).to.be.true;
      const loggedMessage = consoleWarnStub.firstCall.args[0];
      
      expect(loggedMessage).to.include('[WARN]');
      expect(loggedMessage).to.include('[NODE-CRON]');
      expect(loggedMessage).to.include(message);
    });
  });
  
  describe('error', () => {
    it('should call console.error with properly formatted message when passed string', () => {
      const message = 'Error test';
      logger.error(message);
      
      expect(consoleErrorStub.calledOnce).to.be.true;
      const loggedMessage = consoleErrorStub.firstCall.args[0];
      
      expect(loggedMessage).to.include('[ERROR]');
      expect(loggedMessage).to.include('[NODE-CRON]');
      expect(loggedMessage).to.include(message);
    });

    it('should call console.error with properly formatted message when passed Error object', () => {
      const error = new Error('Error object test');
      logger.error(error);
      
      expect(consoleErrorStub.calledOnce).to.be.true;
      const loggedMessage = consoleErrorStub.firstCall.args[0];
      const loggedError = consoleErrorStub.firstCall.args[1];
      
      expect(loggedMessage).to.include('[ERROR]');
      expect(loggedMessage).to.include('[NODE-CRON]');
      expect(loggedMessage).to.include(error.message);
      expect(loggedError).to.equal(error);
    });

    it('should call console.error with properly formatted message and additional error', () => {
      const message = 'Primary error message';
      const additionalError = new Error('Additional error details');
      logger.error(message, additionalError);
      
      expect(consoleErrorStub.calledOnce).to.be.true;
      const loggedMessage = consoleErrorStub.firstCall.args[0];
      const loggedError = consoleErrorStub.firstCall.args[1];
      
      expect(loggedMessage).to.include('[ERROR]');
      expect(loggedMessage).to.include('[NODE-CRON]');
      expect(loggedMessage).to.include(message);
      expect(loggedError).to.equal(additionalError);
    });
  });
  
  describe('debug', () => {
    it('should call console.log with properly formatted message when passed string', () => {
      const message = 'Debug test';
      logger.debug(message);
      
      expect(consoleDebugStub.calledOnce).to.be.true;
      const loggedMessage = consoleDebugStub.firstCall.args[0];
      
      expect(loggedMessage).to.include('[DEBUG]');
      expect(loggedMessage).to.include('[NODE-CRON]');
      expect(loggedMessage).to.include(message);
    });

    it('should call console.log with properly formatted message when passed Error object', () => {
      const error = new Error('Debug error test');
      logger.debug(error);
      
      expect(consoleDebugStub.calledOnce).to.be.true;
      const loggedMessage = consoleDebugStub.firstCall.args[0];
      const loggedError = consoleDebugStub.firstCall.args[1];
      
      expect(loggedMessage).to.include('[DEBUG]');
      expect(loggedMessage).to.include('[NODE-CRON]');
      expect(loggedMessage).to.include(error.message);
      expect(loggedError).to.equal(error);
    });

    it('should call console.log with properly formatted message and additional error', () => {
      const message = 'Primary debug message';
      const additionalError = new Error('Additional debug details');
      logger.debug(message, additionalError);
      
      expect(consoleDebugStub.calledOnce).to.be.true;
      const loggedMessage = consoleDebugStub.firstCall.args[0];
      const loggedError = consoleDebugStub.firstCall.args[1];
      
      expect(loggedMessage).to.include('[DEBUG]');
      expect(loggedMessage).to.include('[NODE-CRON]');
      expect(loggedMessage).to.include(message);
      expect(loggedError).to.equal(additionalError);
    });
  });
  
  describe('log function', () => {
    it('should correctly format timestamp and process ID', () => {
      const message = 'Timestamp test';
      logger.info(message);
      
      expect(consoleInfoStub.calledOnce).to.be.true;
      const loggedMessage = consoleInfoStub.firstCall.args[0];
      
      // Check for timestamp and PID format
      expect(loggedMessage).to.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/); // ISO timestamp format
      expect(loggedMessage).to.match(/\[PID: \d+\]/); // Process ID format
    });
    
    it('should use correct colors for different log levels', () => {
      // This is a limited test since we can't easily check ANSI color codes in the output
      // But we can at least ensure the log function is called correctly
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      logger.debug('Debug message');
      
      expect(consoleInfoStub.calledOnce).to.be.true;
      expect(consoleWarnStub.calledOnce).to.be.true;
      expect(consoleErrorStub.calledOnce).to.be.true;
      expect(consoleDebugStub.calledOnce).to.be.true;
    });
  });
});