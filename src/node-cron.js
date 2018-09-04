'use strict';

var Task = require('./task'),
  ScheduledTask = require('./scheduled-task'),
  validation = require('./pattern-validation');

module.exports = (function() {

  /**
   * Creates a new task to execute given function when the cron
   *  expression ticks.
   *
   * @param {string} expression - cron expression.
   * @param {Function} func - task to be executed.
   * @param {boolean} immediateStart - whether to start the task immediately.
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
}());
