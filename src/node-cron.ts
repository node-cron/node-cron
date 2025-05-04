import { InlineScheduledTask } from "./tasks/inline-scheduled-task";
import { ScheduledTask, TaskContext, TaskFn, TaskOptions } from "./tasks/scheduled-task";
import { Options } from "./types";

import validation from "./pattern/validation/pattern-validation";


/**
 * Creates a new task to execute the given function when the cron
 *  expression ticks.
 *
 * @param {string} expression The cron expression.
 * @param {Function} func The task to be executed.
 * @param {Options} [options] A set of options for the scheduled task.
 * @returns {ScheduledTask} The scheduled task.
 */
function schedule(expression:string, func: TaskFn, options?: Options): ScheduledTask {
    const task = createTask(expression, func, options);
    if(!options || options?.scheduled){
      task.start()
    }
    return task;
}

function createTask(expression: string, func: TaskFn, options?: Options): ScheduledTask {
    const taskOptions: TaskOptions = {
      timezone: options?.timezone
    }
    return new InlineScheduledTask(expression, func, taskOptions);
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

export default { schedule, validate, getTasks };
