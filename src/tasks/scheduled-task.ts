
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
  scheduled?: boolean,
  timezone?: string,
  name?: string,

  beforeRun: (date: Date) => boolean | Promise<boolean>;
  afterRun: (result: any) => void | Promise<void>;
  
}

export type Execution = {
  id: string,
  startedAt?: Date,
  finishedAt?: Date,
  error?: Error,
  result?: any
}

/**
 * Represents a scheduled task that can be managed and executed.
 */
export interface ScheduledTask {
  id: string,
  /**
   * Starts the scheduled task, enabling it to run according to its schedule.
   */
  start(): void;

  /**
   * Stops the scheduled task, preventing it from running until started again.
   */
  stop(): void;

  /**
   * Retrieves the current status of the scheduled task.
   * 
   * @returns A string representing the status of the task.
   */
  getStatus(): string;

  /**
   * Destroys the scheduled task, cleaning up any resources associated with it.
   */
  destroy(): void;

  /**
   * Executes the scheduled task, optionally triggered by a specific event.
   * 
   * @param context - An `TaskContext` that  triggered the execution.
   * @returns A promise that resolves with the result of the execution.
   */
  execute(context: TaskContext): Promise<any>;

  on(event: TaskEvent, fun: (context: TaskContext) => Promise<void>): void
}