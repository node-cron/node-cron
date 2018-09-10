'use strict';

var Task = require('./task'),
  ScheduledTask = require('./scheduled-task'),
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
    // Added for immediateStart depreciation
    if(typeof options === 'boolean'){
      console.warn('DEPRECIATION: imediateStart is deprecated and will be removed soon in favor of the options param.');
      options = {
        scheduled: options
      };
    }
    
    if(!options){
      options = {
        scheduled: true
      };
    }

    var task = new Task(expression, func);
    return new ScheduledTask(task, options);
  }

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
