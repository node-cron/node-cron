
/**
 * Represents an event triggered by a cron job.
 *
 * @property date - The date and time when the event occurred.
 * @property missedCount - The number of executions that were missed prior to this event.
 * @property dateLocalIso - The ISO 8601 formatted local date and time of the event.
 * @property reason - The reason or context for the event.
 * @property task - (Optional) The scheduled task associated with this event.
 */
export type TaskContext = {
  date: Date;
  dateLocalIso: string;
  task?: ScheduledTask;
  execution?: Execution
  triggeredAt: Date;
}

export type TaskEvent =
  | 'task:started'
  | 'task:stopped'
  | 'task:destroyed'
  | 'execution:started'
  | 'execution:finished'
  | 'execution:failed'
  | 'execution:missed'
  | 'execution:overlap';

export type TaskOptions = {
  timezone?: string,
  name?: string,
}

export type Execution = {
  id: string,
  reason: 'invoked' | 'scheduled'
  startedAt?: Date,
  finishedAt?: Date,
  error?: Error,
  result?: any
}

export type TaskFn = (context: TaskContext) => any | Promise<any>;

/**
 * Represents a scheduled task that can be managed and executed.
 */
export interface ScheduledTask {
  id: string,
  name?: string,
  
  start(): void;
  stop(): void;
  getStatus(): string;
  destroy(): void;
  execute(): Promise<any>;

  on(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void
  off(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void
  once(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void 
}