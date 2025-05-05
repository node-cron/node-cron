
import { InlineScheduledTask } from "./tasks/inline-scheduled-task";
import { ScheduledTask, TaskFn, TaskOptions } from "./tasks/scheduled-task";
import { TaskRegistry } from "./task-registry";
import { Options } from "./types";

import validation from "./pattern/validation/pattern-validation";
import BackgroundScheduledTask from "./tasks/background-scheduled-task/background-scheduled-task";

import path from "path";

const registry = new TaskRegistry();

/**
 * Creates a new task to execute the given function when the cron
 *  expression ticks.
 *
 * @param {string} expression The cron expression.
 * @param {Function} func The task to be executed.
 * @param {Options} [options] A set of options for the scheduled task.
 * @returns {ScheduledTask} The scheduled task.
 */
function schedule(expression:string, func: TaskFn | string, options?: Options): ScheduledTask {
    const task = createTask(expression, func, options);
    registry.add(task);

    if(!options || options?.scheduled){
      task.start()
    }
    return task;
}

function createTask(expression: string, func: TaskFn | string, options?: Options): ScheduledTask {
    const taskOptions: TaskOptions = {
      timezone: options?.timezone
    }
    if(func instanceof Function){
      return new InlineScheduledTask(expression, func, taskOptions);
    }

    const taskPath = solvePath(func);
    
    return new BackgroundScheduledTask(expression, taskPath, taskOptions);
}

/**
 * Check if a cron expression is valid.
 *
 * @param {string} expression The cron expression.
 * @returns {boolean} Whether the expression is valid or not.
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

/**
 * Gets the scheduled tasks.
 *
 * @returns {ScheduledTask[]} The scheduled tasks.
 */
function getTasks(): ScheduledTask[] {
    return []
}

function getTaskRegistry(): TaskRegistry{
  return registry;
}

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

export default { schedule, validate, getTasks, getTaskRegistry };
