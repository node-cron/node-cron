'use strict';

var Task = require('./task'),
  ScheduledTask = require('./scheduled-task');

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
  function createTask(expression, func, immediateStart) {
    var task = new Task(expression, func);

    return new ScheduledTask(task, immediateStart);
  }

  return {
    schedule: createTask
  };
}());
