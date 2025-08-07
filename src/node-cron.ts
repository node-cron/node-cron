/**
 * Node Cron
 *
 * A flexible cron-based task scheduling system that supports both inline functions and background task by providing a task file.
 * This module allows you to easily schedule tasks using cron expressions with support for timezones and
 * various execution options.
 *
 * @module node-cron
 */

import path from "node:path";
import { pathToFileURL } from "node:url";

import { InlineScheduledTask } from "./tasks/inline-scheduled-task.js";
import { TaskRegistry } from "./task-registry.js";

import validation from "./pattern/validation/pattern-validation.js";
import BackgroundScheduledTask from "./tasks/background-scheduled-task/background-scheduled-task.js";

import type { ScheduledTask, TaskFn, TaskOptions } from "./tasks/scheduled-task.js";

import rootDirname from './dirname.js';

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
export function schedule(expression:string, func: TaskFn | string, options?: TaskOptions): ScheduledTask {
    const task = createTask(expression, func, options);
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
export function createTask(expression: string, func: TaskFn | string, options?: TaskOptions): ScheduledTask {
    let task: ScheduledTask;
    if(func instanceof Function){
      task = new InlineScheduledTask(expression, func, options);
    } else {
      const taskPath = solvePath(func);
      task = new BackgroundScheduledTask(expression, taskPath, options);
    }

    registry.add(task);
    return task;
}

/**
 * Resolves a relative file path to a file URL path based on the caller's location.
 *
 * @param filePath - The path to the task file, can be absolute or relative
 * @returns The file URL to the task file
 * @throws Error if the task file location cannot be determined
 * @private
 */
export function solvePath(filePath: string): string {
  // Convert to file URL
  if(path.isAbsolute(filePath)) return pathToFileURL(filePath).href;

  // Return immediately if it's a file URL
  if (filePath.startsWith('file://')) return filePath;

  const stackLines = new Error().stack?.split('\n');
  if (stackLines) {
    stackLines?.shift();
    const filename = path.join(rootDirname, 'node-cron.js');
    const callerLine = stackLines?.find((line) => { return line.indexOf(filename) === -1; });
    const match = callerLine?.match(/(file:\/\/)?(((\/?)(\w:))?([/\\].+)):\d+:\d+/);

    if (match) {
      const dir = `${match[5] ?? ""}${path.dirname(match[6])}`;
      return pathToFileURL(path.resolve(dir, filePath)).href;
    }
  }

  throw new Error(`Could not locate task file ${filePath}`);
}

/**
 * Validates a cron expression to ensure it follows the correct format.
 *
 * @param expression - The cron expression to validate
 * @returns `true` if the expression is valid, `false` otherwise
 */
export function validate(expression: string): boolean {
  try {
      validation(expression);

      return true;
  // eslint-disable-next-line
  } catch (e) {
      return false;
  }
}

/**
 * Retrieves all scheduled tasks from the registry.
 *
 * @returns A map of scheduled tasks
 */
export const getTasks = registry.all;

/**
 * Retrieves a specific scheduled task from the registry.
 *
 * @params taskId - The ID of the task to retrieve
 * @returns The task instance if found, `undefined` otherwise
 */
export const getTask = registry.get;

export type { ScheduledTask } from './tasks/scheduled-task.js';
export type { TaskFn, TaskContext, TaskOptions } from './tasks/scheduled-task.js';

export interface NodeCron {
  schedule: typeof schedule;
  createTask: typeof createTask;
  validate: typeof validate;
  getTasks: typeof getTasks;
  getTask: typeof getTask;
}

export const nodeCron: NodeCron = {
  schedule,
  createTask,
  validate,
  getTasks,
  getTask,
};

/**
 * Default export containing the main functions of the module.
 */
export default nodeCron;
