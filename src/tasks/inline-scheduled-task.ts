import EventEmitter from "events";
import { EventType, ScheduledTaskV2 } from "./scheduled-task";
import { TaskEvent } from "./task-event";

class TaskEmitter extends EventEmitter{}

export class InlineScheduledTask implements ScheduledTaskV2 {
  emitter: TaskEmitter;

  constructor(){
    this.emitter = new TaskEmitter();
  }

  start(): void {
    throw new Error("Method not implemented.");
  }
  
  stop(): void {
    throw new Error("Method not implemented.");
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