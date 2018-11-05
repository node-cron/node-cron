'use strict';

var ScheduledTask = require('./scheduled-task'),
    BackgroundScheduledTask = require('./background-scheduled-task'),
    validation = require('./pattern-validation');

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
    function createTask(expression, func, options) {
        if(typeof func === 'string'){
            return new BackgroundScheduledTask(expression, func, options);
        } else {
            return new ScheduledTask(expression, func, options);
        }
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

    return {
        schedule: createTask,
        validate: validate
    };
})();
