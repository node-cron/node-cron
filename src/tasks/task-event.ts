import { ScheduledTask } from "./scheduled-task";

/**
 * Represents an event triggered by a cron job.
 *
 * @property date - The date and time when the event occurred.
 * @property missedCount - The number of executions that were missed prior to this event.
 * @property dateLocalIso - The ISO 8601 formatted local date and time of the event.
 * @property reason - The reason or context for the event.
 * @property task - (Optional) The scheduled task associated with this event.
 */
export type TaskEvent = {
  date: Date;
  missedCount: number;
  dateLocalIso: string;
  reason: string;
  task?: ScheduledTask;
}