'use strict';

import ScheduledTask from './scheduled-task';
import BackgroundScheduledTask from './background-scheduled-task/index';
import validation from './pattern-validation/pattern-validation';
import { save, getTasks as _getTasks } from './storage';

/**
 * @typedef {Object} Options
 * @prop {boolean} [scheduled] if a scheduled task is ready and running to be
 *  performed when the time matches the cron expression.
 * @prop {string} [timezone] the timezone to execute the task in.
 */

type Options = {
    scheduled?: boolean;
    timezone?: string;
    recoverMissedExecutions?: boolean;
    runOnInit?: boolean;
    name?: string;
    preventOverrun?: boolean;
    maxExecutions?: number;
};

/**
 * Creates a new task to execute the given function when the cron
 *  expression ticks.
 *
 * @param {string} expression The cron expression.
 * @param {Function} func The task to be executed.
 * @param {Options} [options] A set of options for the scheduled task.
 * @returns {ScheduledTask | BackgroundScheduledTask} The scheduled task.
 */
function schedule(expression:string, func: Function | string, options?: Options) {
    const task = createTask(expression, func, options);
    save(task);
    return task;
}

function createTask(expression, func, options) {
    if (typeof func === 'string')
        return new BackgroundScheduledTask(expression, func, options);

    return new ScheduledTask(expression, func, options);
}

/**
 * Check if a cron expression is valid.
 *
 * @param {string} expression The cron expression.
 * @returns {boolean} Whether the expression is valid or not.
 */
function validate(expression) {
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
function getTasks() {
    return _getTasks();
}

export default { schedule, validate, getTasks };
