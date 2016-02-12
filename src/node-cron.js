'use strict';

var Task = require('./task');
var ScheduledTask = require('./scheduled-task');

module.exports = (function() {

  /**
   * Creates a new task to execute given function when the cron
   *  expression ticks.
   *
   * @param {string} expression - cron expression.
   * @param {Function} func - task to be executed.
   * @returns {ScheduledTask} update function.
   */
  function createTask(expression, func) {
    var task = new Task(expression, func);
    return new ScheduledTask(task);
  }

  return {
    schedule: createTask
  };
}());
