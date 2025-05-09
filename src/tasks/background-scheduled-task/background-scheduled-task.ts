import { resolve as resolvePath } from 'path';
import { fork, ChildProcess} from 'child_process';

import { Execution, ScheduledTask, TaskContext, TaskEvent, TaskOptions } from '../scheduled-task';
import { createID } from '../../create-id';
import { EventEmitter } from 'stream';
import { StateMachine } from '../state-machine';
import { LocalizedTime } from '../../time/localized-time';
import logger from '../../logger';
import { TimeMatcher } from '../../time/time-matcher';

const daemonPath = resolvePath(__dirname, 'daemon.js');

class TaskEmitter extends EventEmitter{}

class BackgroundScheduledTask implements ScheduledTask{
  emitter: TaskEmitter;
  id: string;
  name: string;
  cronExpression: any;
  taskPath: any;
  options?: any;
  forkProcess?: ChildProcess;
  stateMachine: StateMachine;

  constructor(cronExpression: string, taskPath: string, options?: TaskOptions){
    this.cronExpression = cronExpression;
    this.taskPath = taskPath;
    this.options = options;
    this.id = createID('task');
    this.name = options?.name || this.id;
    this.emitter = new TaskEmitter();
    this.stateMachine = new StateMachine('stopped');

    this.on('task:stopped', () => {
      this.forkProcess?.kill();
      this.forkProcess = undefined;
      this.stateMachine.changeState('stopped');
    });

    this.on('task:destroyed', () => {
      this.forkProcess?.kill();
      this.forkProcess = undefined;
      this.stateMachine.changeState('destroyed');
    });
  }

  getNextRun(): Date | null {
    if ( this.stateMachine.state !== 'stopped'){
      const timeMatcher = new TimeMatcher(this.cronExpression, this.options?.timezone);
      return timeMatcher.getNextMatch(new Date());
    }
    return null;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.forkProcess) {
        return resolve(undefined);
      }
      
      const timeout = setTimeout(() => {
        reject(new Error('Start operation timed out'));
      }, 5000);
      
      try {
        this.forkProcess = fork(daemonPath);
        
        this.forkProcess.on('error', (err) => {
          clearTimeout(timeout);
          reject(new Error(`Error on daemon: ${err.message}`));
        });
        
        this.forkProcess.on('exit', (code, signal) => {
          if (code !== 0 && signal !== 'SIGTERM') {
            const erro = new Error(`node-cron daemon exited with code ${code || signal}`)
            logger.error(erro);
            clearTimeout(timeout);
            reject(erro)
          }
        });
        
        this.forkProcess.on('message', (message: any) => {
          if (message.jsonError) {
            if (message.context?.execution) {
              message.context.execution.error = deserializeError(message.jsonError);
              delete message.jsonError;
            }
          }
          
          if (message.context?.task?.state) {
            this.stateMachine.changeState(message.context?.task?.state);
          }
          
          if (message.context) {
            const execution = message.context?.execution;
            delete execution?.hasError;
                                         
            const context = this.createContext(new Date(message.context.date), execution);

            this.emitter.emit(message.event, context);
          }
        });
        
        this.once('task:started', () => {
          this.stateMachine.changeState('idle');
          clearTimeout(timeout);
          resolve(undefined);
        });
        
        this.forkProcess.send({
          command: 'task:start',
          path: resolvePath(this.taskPath),
          cron: this.cronExpression,
          options: this.options
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.forkProcess) {
        return resolve(undefined);
      }
      
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error('Stop operation timed out'))
      }, 5000); 
      
      const cleanupAndResolve = () => {
        clearTimeout(timeoutId);
        this.off('task:stopped', onStopped);
        
        this.forkProcess = undefined;
        resolve(undefined);
      };

      const onStopped = () => {
        cleanupAndResolve();
      };
      
      this.once('task:stopped', onStopped);
      this.forkProcess.send({
        command: 'task:stop'
      });
    });
  }

  getStatus(): string {
    return this.stateMachine.state;
  }

  destroy(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.forkProcess) {
        return resolve(undefined);
      }

      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error('Destroy operation timed out'))
      }, 5000); 
  
      
      const onDestroy = () => {
        clearTimeout(timeoutId);
        this.off('task:destroyed', onDestroy);    
        resolve(undefined);
      };
      
      this.once('task:destroyed', onDestroy);
      
      this.forkProcess.send({
        command: 'task:destroy'
      });
    });
  }

  execute(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.forkProcess) {
        return reject(new Error('Cannot execute background task because it hasn\'t been started yet. Please initialize the task using the start() method before attempting to execute it.'));
      }
      
      const timeoutId = setTimeout(() => {
        cleanupListeners();
        reject(new Error('Execution timeout exceeded'));
      }, 5000);
      
      const cleanupListeners = () => {
        clearTimeout(timeoutId);
        this.off('execution:finished', onFinished);
        this.off('execution:failed', onFail);
      };
      
      const onFinished = (context: TaskContext) => {
        cleanupListeners();
        resolve(context.execution?.result);
      };
      
      const onFail = (context: TaskContext) => {
        cleanupListeners();
        reject(context.execution?.error || new Error('Execution failed without specific error'));
      };

      this.once('execution:finished', onFinished);
      this.once('execution:failed', onFail);
      
      this.forkProcess.send({
        command: 'task:execute'
      });
    });
  }

  on(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void {
    this.emitter.on(event, fun);
  }

  off(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void {
    this.emitter.off(event, fun);
  }

  once(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void {
    this.emitter.once(event, fun);
  }

  private createContext(executionDate: Date, execution?: Execution): TaskContext{
    const localTime = new LocalizedTime(executionDate, this.options?.timezone)
    const ctx: TaskContext = {
      date: localTime.toDate(),
      dateLocalIso: localTime.toISO(),
      triggeredAt: new Date(),
      task: this,
      execution: execution
    }

    return ctx;
  }
}

function deserializeError(str: string) {
  const data = JSON.parse(str);
  // Create the right kind of Error (TypeError, RangeError, etc.)
  const Err = globalThis[data.name] || Error;
  const err = new Err(data.message);

  if (data.stack) {
    err.stack = data.stack;
  }

  Object.keys(data).forEach(key => {
    if (!['name','message','stack'].includes(key)) {
      err[key] = data[key];
    }
  });

  return err;
}

export default BackgroundScheduledTask;