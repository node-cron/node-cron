import { resolve } from 'path';
import { fork, ChildProcess} from 'child_process';

import { ScheduledTask, TaskContext, TaskEvent, TaskOptions } from '../scheduled-task';
import { createID } from '../../create-id';
import { EventEmitter } from 'stream';

const daemonPath = resolve(__dirname, 'daemon.js');

class TaskEmitter extends EventEmitter{}

class BackgroundScheduledTask implements ScheduledTask{
  emitter: TaskEmitter;
  id: string;
  name?: string | undefined;
  cronExpression: any;
  taskPath: any;
  options?: any;
  forkProcess?: ChildProcess;

  constructor(cronExpression: string, taskPath: string, options: TaskOptions){
    this.cronExpression = cronExpression;
    this.taskPath = taskPath;
    this.options = options;
    this.id = createID('task');
    this.emitter = new TaskEmitter();
  }

  start(): void {
    if(this.forkProcess) return;

    this.forkProcess = fork(daemonPath);

    // bypass all events from daemon as triggred by this task
    this.forkProcess.on('message', (message: any) => {
      if(message.jsonError){
        if(message.context?.execution){
          message.context.execution.error = deserializeError(message.jsonError)
        }
      }
      this.emitter.emit(message.event, message.context);
    });

    this.forkProcess.send({
        command: 'task:start',
        path: resolve(this.taskPath),
        cron: this.cronExpression,
        options: this.options
    });
  }

  stop(): void {
    if(this.forkProcess){
      this.forkProcess.send({
        command: 'task:stop'
      });
      // TODO: graceful shutdown
      this.forkProcess.kill();
      this.forkProcess = undefined;
    }
  }

  getStatus(): string {
    throw new Error('Method not implemented.');
  }

  destroy(): void {
    if(this.forkProcess){
      this.forkProcess.send({
        command: 'task:destroy'
      });
      // TODO: graceful shutdown
      this.forkProcess.kill();
      this.forkProcess = undefined;
    }
  }

  execute(): Promise<any> {
    return new Promise((resolve, reject) => {
      if(this.forkProcess){
        this.forkProcess.send({
          command: 'task:execute'
        });

      const onFail = (context: TaskContext) => {
        this.off('execution:finished', onFail);
        reject(context.execution?.error)
      };

      const onFinished = (context: TaskContext) => {
        this.off('execution:failed', onFail);
        resolve(context.execution?.result)
      }

      this.once('execution:finished', onFinished);
      this.once('execution:failed', onFail);
      }
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