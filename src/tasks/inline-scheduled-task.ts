import EventEmitter from "events";
import { Execution, ScheduledTask, TaskContext, TaskEvent, TaskOptions } from "./scheduled-task";
import { Runner, RunnerOptions } from "src/scheduler/runner";
import { TimeMatcher } from "src/time/time-matcher";
import { createID } from "src/create-id";
import { StateMachine } from "./state-machine";
import logger from "src/logger";
import { LocalizedTime } from "src/time/localized-time";

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

  constructor(cronExpression: string, taskFn: Function, options?: TaskOptions){
    this.emitter = new TaskEmitter();
    this.cronExpression = cronExpression;
  
    this.id = createID('task', 12);
    this.name = options?.name || this.id;
    this.timezone = options?.timezone;

    this.timeMatcher = new TimeMatcher(cronExpression, options?.timezone)
    this.stateMachine = new StateMachine();

    const runnerOptions: RunnerOptions = {
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
        logger.error(error);
        this.emitter.emit('execution:failed', this.createContext(date, execution));
        this.changeState('idle');
      },
      onOverlap: (date: Date) => {
        this.emitter.emit('execution:overlap', this.createContext(date));
      },
      onMissedExecution: (date: Date) => {
        this.emitter.emit('execution:missed', this.createContext(date));
      }
    }
    this.runner = new Runner(this.timeMatcher, taskFn, runnerOptions);
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
        this.off('execution:finished', onFail);
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

  private createContext(executionDate: Date, execution?: Execution): TaskContext{
    const localTime = new LocalizedTime(executionDate, this.timezone)
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