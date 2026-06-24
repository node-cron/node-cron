import { dirname, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
import { fork, ChildProcess} from 'child_process';

import { Execution, LastRun, ScheduledTask, TaskContext, TaskEvent, TaskOptions } from '../scheduled-task';
import { createID } from '../../create-id';
import { EventEmitter } from 'events';
import { StateMachine } from '../state-machine';
import { LocalizedTime } from '../../time/localized-time';
import logger, { Logger } from '../../logger';
import { TimeMatcher } from '../../time/time-matcher';
import { RunCoordinator, SkipReason, resolveRunCoordinator } from '../../coordinator/run-coordinator';

// fileURLToPath(import.meta.url) works on every ESM-capable Node (unlike
// import.meta.dirname, which requires >= 20.11). The CJS build rewrites it to
// __filename.
const daemonPath = resolvePath(dirname(fileURLToPath(import.meta.url)), 'daemon.js');

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
  logger: Logger;
  suppressMissedWarning: boolean;
  timeMatcher: TimeMatcher;
  runCount: number;
  // The run coordinator lives here in the parent (it cannot cross the fork). The
  // daemon asks over IPC and this process runs the real coordinator.
  runCoordinator?: RunCoordinator;
  // The last actual execution, mirrored in the parent from the daemon's
  // forwarded finished/failed events.
  private _lastRun: LastRun | null = null;

  constructor(cronExpression: string, taskPath: string, options?: TaskOptions){
    this.cronExpression = cronExpression;
    this.taskPath = taskPath;
    this.options = options;
    this.id = createID();
    this.name = options?.name || this.id;
    this.emitter = new TaskEmitter();
    this.stateMachine = new StateMachine('stopped');
    // The execution count lives in the daemon; mirror it here from the forwarded
    // events so runsLeft() works across the process boundary.
    this.timeMatcher = new TimeMatcher(cronExpression, options?.timezone);
    this.runCount = 0;
    this.on('execution:started', () => { this.runCount++; });
    // Mirror the last actual execution from the daemon's events. Both carry the
    // execution's own timestamps, so lastRun reflects the real run time.
    this.on('execution:finished', (context) => { this.recordLastRun(context.execution); });
    this.on('execution:failed', (context) => { this.recordLastRun(context.execution); });
    // The logger lives in the parent process: it cannot cross the fork
    // boundary. The daemon runs with a no-op logger and forwards events, and
    // this process logs from those events using the configured logger.
    this.logger = options?.logger || logger;
    this.suppressMissedWarning = options?.suppressMissedWarning || false;
    this.runCoordinator = options?.distributed ? resolveRunCoordinator(options?.runCoordinator) : undefined;

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
      return this.timeMatcher.getNextMatch(new Date());
    }
    return null;
  }

  getNextRuns(count: number): Date[] {
    const runs: Date[] = [];
    let from = new Date();
    for (let i = 0; i < count; i++) {
      from = this.timeMatcher.getNextMatch(from);
      runs.push(from);
    }
    return runs;
  }

  match(date: Date): boolean {
    return this.timeMatcher.match(date);
  }

  msToNext(): number | null {
    const next = this.getNextRun();
    return next ? next.getTime() - Date.now() : null;
  }

  isBusy(): boolean {
    return this.getStatus() === 'running';
  }

  runsLeft(): number | undefined {
    if (this.options?.maxExecutions == null) return undefined;
    return Math.max(0, this.options.maxExecutions - this.runCount);
  }

  getPattern(): string {
    return this.cronExpression;
  }

  lastRun(): LastRun | null {
    return this._lastRun;
  }

  // Record the last actual execution from a forwarded event. Timestamps may
  // arrive as ISO strings over IPC, so coerce them back to Date and prefer the
  // execution's own finish/start time over any tick check.
  private recordLastRun(execution?: Execution){
    if (!execution) return;
    const raw = execution.finishedAt ?? execution.startedAt;
    const date = raw ? new Date(raw) : new Date();
    const lastRun: LastRun = { date };
    if (execution.error) {
      lastRun.error = execution.error;
    } else {
      lastRun.result = execution.result;
    }
    this._lastRun = lastRun;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.forkProcess) {
        return resolve(undefined);
      }

      const startTimeout = this.options?.startTimeout ?? 5000;

      // Any failure to start must also tear down the daemon. Otherwise a daemon
      // that loads slowly (past the timeout) stays alive and keeps running the
      // schedule on its own, leading to orphaned/duplicate executions.
      const failStart = (error: Error) => {
        clearTimeout(timeout);
        this.forkProcess?.kill();
        this.forkProcess = undefined;
        reject(error);
      };

      const timeout = setTimeout(() => {
        failStart(new Error(
          `Start operation timed out after ${startTimeout}ms. The background task file may have failed to load or taken too long to import; ` +
          `verify it runs on its own and consider increasing the \`startTimeout\` option.`
        ));
      }, startTimeout);

      try {
        this.forkProcess = fork(daemonPath);

        this.forkProcess.on('error', (err) => {
          failStart(new Error(`Error on daemon: ${err.message}`));
        });

        this.forkProcess.on('exit', (code, signal) => {
          if (code !== 0 && signal !== 'SIGTERM') {
            const erro = new Error(`node-cron daemon exited with code ${code || signal}`)
            this.logger.error(erro);
            failStart(erro);
          }
        });

        this.forkProcess.on('message', (message: any) => {
          // Run coordination over IPC: the daemon asks, the parent runs the
          // real coordinator and replies. Cross-fleet coordination is in the
          // shared backend (e.g. Redis); IPC only bridges child to its parent.
          if (message.type === 'coordinator:shouldRun') {
            void this.handleShouldRun(message);
            return;
          }
          if (message.type === 'coordinator:complete') {
            this.runCoordinator?.onComplete?.(message.key)?.catch?.((err: any) => this.logger.error('Run coordinator onComplete failed', err));
            return;
          }

          if (message.event === 'daemon:error') {
            // The daemon could not load/start the task file. Reject with the
            // real cause so the user sees what actually went wrong.
            failStart(message.jsonError ? deserializeError(message.jsonError) : new Error('Background task failed to start'));
            return;
          }

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

            const context = this.createContext(new Date(message.context.date), execution, message.context.reason);

            this.logEvent(message.event, context);
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
          path: this.taskPath,
          cron: this.cronExpression,
          options: serializableOptions(this.options)
        });
      } catch (error) {
        failStart(error as Error);
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
        this.forkProcess?.kill();
        this.forkProcess = undefined;
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
        this.forkProcess?.kill();
        this.forkProcess = undefined;
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
      
      // No timeout by default: wait for the task to actually finish or fail.
      // An optional `executeTimeout` (ms) opts into a guard against a daemon
      // that never reports back.
      let timeoutId: NodeJS.Timeout | undefined;
      if (typeof this.options?.executeTimeout === 'number') {
        timeoutId = setTimeout(() => {
          cleanupListeners();
          reject(new Error('Execution timeout exceeded'));
        }, this.options.executeTimeout);
      }

      const cleanupListeners = () => {
        if (timeoutId) clearTimeout(timeoutId);
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

  // Handles a coordinator:shouldRun request from the daemon: run the real
  // coordinator and reply. A coordinator error is reported back (via `error`) so
  // the daemon's runner fails closed and skips the run, mirroring the inline path.
  private async handleShouldRun(message: { key: string; ttlMs: number; reqId: string }): Promise<void> {
    let allowed = false;
    let error: string | undefined;
    try {
      allowed = this.runCoordinator ? await this.runCoordinator.shouldRun(message.key, message.ttlMs) : false;
    } catch (err: any) {
      error = err?.message ?? String(err);
    }
    this.forkProcess?.send({ type: 'coordinator:result', reqId: message.reqId, allowed, error });
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

  // The daemon runs with a no-op logger, so user-facing logging happens here in
  // the parent, driven by the events the daemon forwards. Mirrors the inline
  // task's logging policy.
  private logEvent(event: TaskEvent, context: TaskContext): void {
    switch(event){
      case 'execution:missed': {
        const handled = this.emitter.listenerCount('execution:missed') > 0;
        if(!this.suppressMissedWarning && !handled){
          this.logger.warn(`missed execution at ${context.date}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
        }
        break;
      }
      case 'execution:overlap':
        if(this.options?.noOverlap){
          this.logger.warn('task still running, new execution blocked by overlap prevention!');
        }
        break;
      case 'execution:failed':
        if(context.execution?.error){
          this.logger.error(context.execution.error);
        }
        break;
    }
  }

  private createContext(executionDate: Date, execution?: Execution, reason?: SkipReason): TaskContext{
    const localTime = new LocalizedTime(executionDate, this.options?.timezone)
    const ctx: TaskContext = {
      date: localTime.toDate(),
      dateLocalIso: localTime.toISO(),
      triggeredAt: new Date(),
      task: this,
      execution: execution
    }

    if (reason) ctx.reason = reason;

    return ctx;
  }
}

/**
 * Strips options that cannot cross the process boundary (function-bearing
 * objects: a custom `logger` and the `runCoordinator`). The parent keeps the
 * original options; it does the logging itself and runs the coordinator on the
 * daemon's behalf over IPC.
 */
function serializableOptions(options?: TaskOptions): TaskOptions | undefined {
  if(!options) return options;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { logger: _logger, runCoordinator: _runCoordinator, ...rest } = options;
  return rest;
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