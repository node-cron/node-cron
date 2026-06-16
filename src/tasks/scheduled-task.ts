import { Logger } from "../logger";

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
  | 'execution:overlap'
  | 'execution:maxReached'

export type TaskOptions = {
  timezone?: string,
  name?: string,
  noOverlap?: boolean,
  maxExecutions?: number,
  maxRandomDelay?: number,
  /**
   * Custom logger for this task. Overrides the global logger set via
   * `setLogger`. Note: not supported for background tasks (it cannot cross
   * the process boundary); use `setLogger` for those.
   */
  logger?: Logger,
  /**
   * When true, suppresses the "missed execution" warning for this task.
   * The warning is also suppressed automatically when an `execution:missed`
   * listener is attached.
   */
  suppressMissedWarning?: boolean,
  /**
   * Timeout in milliseconds for `execute()` on background tasks. When set,
   * `execute()` rejects with "Execution timeout exceeded" if the task has not
   * reported back in time. Defaults to no timeout (waits for the task to
   * finish or fail). Has no effect on inline tasks.
   */
  executeTimeout?: number
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
  
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
  getStatus(): string;
  destroy(): void | Promise<void>;
  execute(): Promise<any>;
  getNextRun(): Date | null;

  on(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void
  off(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void
  once(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void 
}