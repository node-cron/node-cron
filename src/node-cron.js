'use strict';

const ScheduledTask = require('./scheduled-task');
const BackgroundScheduledTask = require('./background-scheduled-task');
const validation = require('./pattern-validation');
const storage = require('./storage');

module.exports = (() => {

    /**
   * Creates a new task to execute given function when the cron
   *  expression ticks.
   *
   * @param {string} expression - cron expression.
   * @param {Function} func - task to be executed.
   * @param {Object} options - a set of options for the scheduled task:
   *    - scheduled <boolean>: if a schaduled task is ready and running to be 
   *      performed when the time mach with the cron excpression.
   *    - timezone <string>: the tiemzone to execute the tasks.
   * 
   *    Example: 
   *    {
   *      "scheduled": true,
   *      "timezone": "America/Sao_Paulo"
   *    } 
   * 
   * @returns {ScheduledTask} update function.
   */
    function schedule(expression, func, options) {
        let task = createTask(expression, func, options);
        storage.save(task);
        return task;
    }

    function createTask(expression, func, options){
        if(typeof func === 'string'){
            return new BackgroundScheduledTask(expression, func, options);
        }
        return new ScheduledTask(expression, func, options);
    }

    /**
     * Check if a cron expression is valid
     * @param {string} expression - cron expression.
     * 
     * @returns {boolean} - returns true if expression is valid
     */
    function validate(expression) {
        try {
            validation(expression);
        } catch(e) {
            return false;
        }

        return true;
    }

    function getTasks() {
        return storage.getTasks();
    }

    return {
        schedule: schedule,
        validate: validate,
        getTasks: getTasks
    };
})();
