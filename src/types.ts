/**
 * Represents the configuration options for a scheduled task.
 *
 * @property {boolean} [scheduled] - Indicates whether the task should be scheduled. Defaults to `true`.
 * @property {string} [timezone] - Specifies the timezone in which the task should run. Accepts a string in the IANA timezone database format (e.g., "America/New_York").
 * @property {boolean} [catchUp] - Determines if missed executions should be caught up when it misses executins, during blocking io. Defaults to `false`.
 * @property {boolean} [runOnStart] - If `true`, the task will execute immediately upon creation. Defaults to `false`.
 * @property {string} [name] - An optional name for the task, useful for identification and debugging.
 * @property {boolean} [noOverlap] - Ensures that the task does not run concurrently with itself.Defaults to `false`.
 * @property {number} [maxExecutions] - Specifies the maximum number of times the task should execute. If not provided, the task will run indefinitely.
 */
export type Options = {
    scheduled?: boolean;
    timezone?: string;
    catchUp?: boolean;
    runOnStart?: boolean;
    name?: string;
    noOverlap?: boolean;
    maxExecutions?: number;
    onError?: Function
};

/**
 * Represents an event triggered by a cron job.
 *
 * @property date - The date and time when the event occurred.
 * @property missedCount - The number of executions that were missed prior to this event.
 * @property dateLocalIso - The ISO 8601 formatted local date and time of the event.
 * @property reason - The reason or context for the event.
 * @property task - (Optional) The scheduled task associated with this event.
 */
export type CronEvent = {
  date: Date;
  missedCount: number;
  dateLocalIso: string;
  reason: string;
  task?: ScheduledTask;
}

/**
 * Represents a scheduled task that can be managed and executed.
 */
export interface ScheduledTask {
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
   * @param event - An optional `CronEvent` that may trigger the execution.
   * @returns A promise that resolves with the result of the execution.
   */
  execute(event?: CronEvent): Promise<any>;
}