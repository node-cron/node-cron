/**
 * Node Cron
 * 
 * A flexible cron-based task scheduling system that supports both inline functions and background task by providing a task file.
 * This module allows you to easily schedule tasks using cron expressions with support for timezones and
 * various execution options.
 * 
 * @module node-cron
 */

import { InlineScheduledTask } from "./tasks/inline-scheduled-task";
import { ScheduledTask, TaskFn, TaskOptions } from "./tasks/scheduled-task";
import { TaskRegistry } from "./task-registry";

import validation from "./pattern/validation/pattern-validation";
import BackgroundScheduledTask from "./tasks/background-scheduled-task/background-scheduled-task";

import path from "path";

export interface NodeCron {
  schedule: typeof schedule;
  createTask: typeof createTask;
  validate: typeof validate;
}

/**
 * Represents the configuration options for a scheduled task.
 *
 * @property {string} [name] - An optional name for the task, useful for identification and debugging.
 * @property {boolean} [scheduled] - Indicates whether the task should be scheduled. Defaults to `true`.
 * @property {string} [timezone] - Specifies the timezone in which the task should run. Accepts a string in the IANA timezone database format (e.g., "America/New_York").
 * @property {boolean} [noOverlap] - Ensures that the task does not run concurrently with itself.Defaults to `false`.
 * @property {number} [maxExecutions] - Specifies the maximum number of times the task should execute. If not provided, the task will run indefinitely.
 */
export type Options = {
  name?: string;
  timezone?: string;
  noOverlap?: boolean;
  maxExecutions?: number;
};

/**
 * The central registry that maintains all scheduled tasks.
 * @private
 */
const registry = new TaskRegistry();


/**
 * Schedules a task to be executed according to the provided cron expression.
 * 
 * @param expression - A cron expression (e.g. '* * * * *' for every minute) that determines when the task executes
 * @param func - Either a function to be executed or a file path to a module containing the task function
 * @param options - Optional configuration for the task including timezone and whether to start immediately
 * @returns The created task instance that can be used to control the task
 * 
 * @example
 * // Schedule an inline function to run every minute
 * const task = schedule('* * * * *', () => console.log('Running every minute'));
 * 
 * @example
 * // Schedule background task by providing a separate file to run daily with a specific timezone
 * const dailyTask = schedule('0 0 * * *', './tasks/daily-backup.js', { timezone: 'America/New_York' });
 */
function schedule(expression:string, func: TaskFn | string, options?: Options): ScheduledTask {
    options = Object.assign({ scheduled: true }, options);

    const taskOptions: TaskOptions = {
      name: options?.name,
      timezone: options?.timezone,
      noOverlap: options?.noOverlap,
      maxExecutions: options?.maxExecutions
    }

    const task = createTask(expression, func, taskOptions);

    task.start();

    return task;
}

/**
 * Creates a task instance based on the provided parameters adding it to the registry.
 * 
 * @param expression - A cron expression that determines when the task executes
 * @param func - Either a function to be executed or a file path to a module containing the task function
 * @param options - Optional configuration for the task
 * @returns A task instance of the appropriate type (inline or background)
 * @private
 */
function createTask(expression: string, func: TaskFn | string, options?: Options): ScheduledTask {
    const taskOptions: TaskOptions = {
      timezone: options?.timezone
    }

    let task: ScheduledTask;
    if(func instanceof Function){
      task = new InlineScheduledTask(expression, func, taskOptions);
    } else {
      const taskPath = solvePath(func);
      task = new BackgroundScheduledTask(expression, taskPath, taskOptions);
    }

    registry.add(task);

    return task;
}

/**
 * Resolves a relative file path to an absolute path based on the caller's location.
 * 
 * @param filePath - The path to the task file, can be absolute or relative
 * @returns The absolute path to the task file
 * @throws Error if the task file location cannot be determined
 * @private
 */
function solvePath(filePath: string): string {
  if(path.isAbsolute(filePath)) return filePath;

  const stackLines = new Error().stack?.split('\n');
  if(stackLines){
    stackLines?.shift();
    const callerLine = stackLines?.find((line) => { return line.indexOf(__filename) === -1; });
    const match = callerLine?.match(/\((.*):\d+:\d+\)/);
    if (match) {
      const dir = path.dirname(match[1]);
      return path.resolve(dir, filePath);
    }
  }

  throw new Error(`Could not locate task file ${path}`);
}

/**
 * Validates a cron expression to ensure it follows the correct format.
 * 
 * @param expression - The cron expression to validate
 * @returns `true` if the expression is valid, `false` otherwise
 */
function validate(expression: string): boolean {
  try {
      validation(expression);

      return true;
  // eslint-disable-next-line
  } catch (e) {
      return false;
  }
}

export { ScheduledTask } from './tasks/scheduled-task';
export type { TaskFn, TaskContext, TaskOptions } from './tasks/scheduled-task';

const nodeCron: NodeCron = {
  schedule,
  createTask,
  validate
};

/**
 * Default export containing the main functions of the module.
 */
export default nodeCron;