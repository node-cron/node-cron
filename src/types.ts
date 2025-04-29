/**
 * @prop {boolean} [scheduled] if a scheduled task is ready and running to be
 *  performed when the time matches the cron expression.
 * @prop {string} [timezone] the timezone to execute the task in.
 */
export type Options = {
    scheduled?: boolean;
    timezone?: string;
    recoverMissedExecutions?: boolean;
    runOnInit?: boolean;
    name?: string;
    preventOverrun?: boolean;
    maxExecutions?: number;
};

export type CronEvent = {
  date: Date;
  missedExecutions: number;
  matchedDate?: Date;
  reason: string;
  task?: ScheduledTask;
}

export interface ScheduledTask {
  start() :void;
  stop() :void;
  getStatus() :string;
  destroy() :void;
  execute(event?: any):Promise<any>;
}