
import BasicScheduledTask from './basic-scheduled-task';
import BackgroundScheduledTask from './background-scheduled-task/index';
import validation from './pattern-validation/pattern-validation';
import * as storage from './storage';
import { ScheduledTask, Options } from './types';

/**
 * Creates a new task to execute the given function when the cron
 *  expression ticks.
 *
 * @param {string} expression The cron expression.
 * @param {Function} func The task to be executed.
 * @param {Options} [options] A set of options for the scheduled task.
 * @returns {ScheduledTask} The scheduled task.
 */
function schedule(expression:string, func: Function | string, options?: Options): ScheduledTask {
    const task = createTask(expression, func, options);
    storage.save(task);
    return task;
}

function createTask(expression: string, func: Function | string, options?: Options): ScheduledTask {
    if (typeof func === 'string')
        return new BackgroundScheduledTask(expression, func, options);

    return new BasicScheduledTask(expression, func, options);
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
    return storage.getTasks();
}

export default { schedule, validate, getTasks };
