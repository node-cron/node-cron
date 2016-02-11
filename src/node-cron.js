'use strict';

var Task = require('./task');

module.exports = (function() {

  /**
   * Creates a new task to execute given function when the cron
   *  expression ticks.
   *
   * @param {string} expression - cron expression.
   * @param {Function} func - task to be executed.
   * @returns {intervalObject} update function.
   */
  function createTask(expression, func) {
    var task = new Task(expression, func);

    return setInterval(function() {
      task.update(new Date());
    }, 1000);
  }

  /**
   * Stops a cron task.
   *
   * @param {intervalObject} task - task to be stopped.
   */
  function stopTask(task) {
    clearInterval(task);
  }

  return {
    schedule: createTask,
    stop: stopTask
  };
}());
