import { EventEmitter } from "events";
import { Execution, ScheduledTask, TaskContext, TaskEvent, TaskFn, TaskOptions } from "./scheduled-task";
import { Runner, RunnerOptions } from "../scheduler/runner";
import { TimeMatcher } from "../time/time-matcher";
import { createID } from "../create-id";
import { StateMachine } from "./state-machine";
import logger, { Logger } from "../logger";
import { LocalizedTime } from "../time/localized-time";
import { resolveRunCoordinator, SkipReason } from "../coordinator/run-coordinator";

class TaskEmitter extends EventEmitter{}

export class InlineScheduledTask implements ScheduledTask {
  emitter: TaskEmitter;
  cronExpression: string;
  timeMatcher: TimeMatcher;
  runner: Runner;
  id: string;
  name: string;
  stateMachine: StateMachine;
  timezone?: string;
  logger: Logger;
  suppressMissedWarning: boolean;

  constructor(cronExpression: string, taskFn: TaskFn, options?: TaskOptions){
    this.emitter = new TaskEmitter();
    this.cronExpression = cronExpression;

    this.id = createID('task', 12);
    this.name = options?.name || this.id;
    this.timezone = options?.timezone;
    this.logger = options?.logger || logger;
    this.suppressMissedWarning = options?.suppressMissedWarning || false;

    this.timeMatcher = new TimeMatcher(cronExpression, options?.timezone)
    this.stateMachine = new StateMachine();

    const runnerOptions: RunnerOptions = {
      timezone: options?.timezone,
      noOverlap: options?.noOverlap,
      maxExecutions: options?.maxExecutions,
      maxRandomDelay: options?.maxRandomDelay,
      missedExecutionTolerance: options?.missedExecutionTolerance,
      logger: this.logger,
      beforeRun: (date: Date, execution: Execution) => {
        if(execution.reason === 'scheduled'){
          this.changeState('running');
        }
        this.emitter.emit('execution:started', this.createContext(date, execution));
        return true;
      },
      onFinished: (date: Date, execution: Execution) => {
        if(execution.reason === 'scheduled'){
          this.changeState('idle');
        }
        this.emitter.emit('execution:finished', this.createContext(date, execution));
        return true;
      },
      onError: (date: Date, error: Error, execution: Execution) => {
        this.logger.error(error);
        this.emitter.emit('execution:failed', this.createContext(date, execution));
        this.changeState('idle');
      },
      onOverlap: (date: Date) => {
        this.emitter.emit('execution:overlap', this.createContext(date));
      },
      onMissedExecution: (date: Date) => {
        // Warn only when the caller is not handling the missed execution
        // themselves (no listener) and has not opted out explicitly.
        const handled = this.emitter.listenerCount('execution:missed') > 0;
        if(!this.suppressMissedWarning && !handled){
          this.logger.warn(`missed execution at ${date}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
        }
        this.emitter.emit('execution:missed', this.createContext(date));
      },
      onMaxExecutions: (date: Date) => {
        this.emitter.emit('execution:maxReached', this.createContext(date));
        this.destroy();
      },
      // Distributed coordination: only wired when this task opted in
      // (`distributed: true`). A per-task coordinator wins, then the global one,
      // then the env-var default (in a daemon this is the IPC bridge to the parent).
      runCoordinator: options?.distributed ? resolveRunCoordinator(options?.runCoordinator) : undefined,
      coordinatorKeyPrefix: this.name,
      coordinatorTtl: options?.distributedTtl,
      onSkipped: (date: Date, reason: SkipReason) => {
        this.emitter.emit('execution:skipped', this.createContext(date, undefined, reason));
      }
    }
    
    this.runner = new Runner(this.timeMatcher, (date, execution) => {
      return taskFn(this.createContext(date, execution));
    }, runnerOptions);
  }

  getNextRun(): Date | null{
    if ( this.stateMachine.state !== 'stopped'){
      return this.runner.nextRun();
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
    if (this.runner.maxExecutions == null) return undefined;
    return Math.max(0, this.runner.maxExecutions - this.runner.runCount);
  }

  getPattern(): string {
    return this.cronExpression;
  }

  private changeState(state){
    if(this.runner.isStarted()){
      this.stateMachine.changeState(state);
    }
  }

  start(): void {
    if(this.runner.isStopped()){
      this.runner.start();
      this.stateMachine.changeState('idle');
      this.emitter.emit('task:started', this.createContext(new Date()));
    } 
  }
  
  stop(): void {
    if(this.runner.isStarted()) { 
      this.runner.stop();
      this.stateMachine.changeState('stopped');
      this.emitter.emit('task:stopped', this.createContext(new Date()));
    }
  }

  getStatus(): string {
    return this.stateMachine.state;
  }
  
  destroy(): void {
    if (this.stateMachine.state === 'destroyed') return;

    this.stop();
    this.stateMachine.changeState('destroyed');
    this.emitter.emit('task:destroyed', this.createContext(new Date()));
  }
  
  execute() {
    return new Promise<any>((resolve, reject) => {
      const onFail = (context: TaskContext) => {
        this.off('execution:finished', onFinished);
        reject(context.execution?.error)
      };

      const onFinished = (context: TaskContext) => {
        this.off('execution:failed', onFail);
        resolve(context.execution?.result)
      }

      this.once('execution:finished', onFinished);
      this.once('execution:failed', onFail);

      this.runner.execute();
    })
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

  private createContext(executionDate: Date, execution?: Execution, reason?: SkipReason): TaskContext{
    const localTime = new LocalizedTime(executionDate, this.timezone)
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