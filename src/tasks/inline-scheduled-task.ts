import EventEmitter from "events";
import { EventType, ScheduledTaskV2 } from "./scheduled-task";
import { TaskEvent } from "./task-event";
import { Runner } from "src/scheduler/runner";
import { TimeMatcher } from "src/time/time-matcher";
import { NodeCronOptions } from "src/node-cron-options";

class TaskEmitter extends EventEmitter{}

export class InlineScheduledTask implements ScheduledTaskV2 {
  emitter: TaskEmitter;
  cronExpression: string;
  taskFn: Function;
  timeMatcher: TimeMatcher;
  runner: Runner;

  constructor(cronExpression: string, taskFn: Function, options: NodeCronOptions){
    this.emitter = new TaskEmitter();
    this.cronExpression = cronExpression;
    this.taskFn = taskFn;
    this.timeMatcher = new TimeMatcher(cronExpression, options.timezone)
    this.runner = new Runner(this.timeMatcher, this.taskFn);
  }

  start(): void {
    if(this.runner.isStopped()) this.runner.start();
  }
  
  stop(): void {
    if(this.runner.isStarted()) this.runner.stop();
  }

  getStatus(): string {
    throw new Error("Method not implemented.");
  }
  
  destroy(): void {
    throw new Error("Method not implemented.");
  }
  
  execute(event?: TaskEvent): Promise<any> {
    throw new Error("Method not implemented.");
  }

  on(event: EventType, fun: (taskEvent: TaskEvent) => Promise<void>): void {
    this.emitter.on(event, fun);
  }
}