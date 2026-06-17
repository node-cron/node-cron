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
import logger from "./logger";

import validation, { parse as parseExpression, validateDetailed as validateDetailedExpression } from "./pattern/validation/pattern-validation";
import BackgroundScheduledTask from "./tasks/background-scheduled-task/background-scheduled-task";
import { setLogger } from "./logger";
import { setLockProvider, getLockProvider } from "./lock/lock-provider";

import path from "path";
import { pathToFileURL, fileURLToPath } from "url";

// fileURLToPath(import.meta.url) works on every ESM-capable Node (unlike
// import.meta.filename, which requires >= 20.11). The CJS build rewrites it to
// __filename.
const moduleFilename = fileURLToPath(import.meta.url);

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
    // Background tasks start asynchronously and can fail (e.g. the task file
    // cannot be loaded). Route that failure to the logger instead of leaving it
    // as an unhandled rejection.
    const started = task.start();
    if (started && typeof (started as Promise<void>).catch === 'function') {
      (started as Promise<void>).catch((error: any) => {
        (options?.logger || logger).error(`Failed to start scheduled task: ${error?.message ?? error}`);
      });
    }
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
    if (options?.lock) {
      if (!options.name)
        throw new Error('`lock` requires a `name` (it forms the lock key shared across instances).');
      if (!(options.lockProvider ?? getLockProvider()))
        throw new Error('`lock` requires a lock provider — call cron.setLockProvider(...) before scheduling.');
    }

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
  if(stackLines){
    stackLines?.shift();
    const callerLine = stackLines?.find((line) => { return line.indexOf(moduleFilename) === -1; });
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
 * Validates a cron expression and returns a structured result with every
 * problem (field name, offending value and reason), instead of a plain boolean.
 * Useful for tooling, editors and richer error messages.
 *
 * @param expression - The cron expression to validate
 */
export const validateDetailed = validateDetailedExpression;

/**
 * Parses a cron expression into its decomposed fields, or throws an Error with
 * a useful message (which field, which value) for the first problem found.
 *
 * @param expression - The cron expression to parse
 */
export const parse = parseExpression;

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

export { setLogger } from './logger';
export { setLockProvider } from './lock/lock-provider';

export type { ScheduledTask, TaskFn, TaskContext, TaskOptions } from './tasks/scheduled-task';
export type { Logger } from './logger';
export type { ParsedFields, DetailedValidation, CronFieldError } from './pattern/validation/pattern-validation';
export type { LockProvider } from './lock/lock-provider';

export interface NodeCron {
  schedule: typeof schedule;
  createTask: typeof createTask;
  validate: typeof validate;
  validateDetailed: typeof validateDetailed;
  parse: typeof parse;
  getTasks: typeof getTasks;
  getTask: typeof getTask;
  setLogger: typeof setLogger;
  setLockProvider: typeof setLockProvider;
}

export const nodeCron: NodeCron = {
  schedule,
  createTask,
  validate,
  validateDetailed,
  parse,
  getTasks,
  getTask,
  setLogger,
  setLockProvider,
};

/**
 * Default export containing the main functions of the module.
 */
export default nodeCron;