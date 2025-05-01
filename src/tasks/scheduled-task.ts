import { TaskEvent } from "./task-event";

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
   * @param event - An optional `TaskEvent` that may trigger the execution.
   * @returns A promise that resolves with the result of the execution.
   */
  execute(event?: TaskEvent): Promise<any>;
}