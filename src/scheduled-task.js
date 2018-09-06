'use strict';

var tzOffset = require('tz-offset');

module.exports = (function() {

  /**
   * Creates a new scheduled task.
   *
   * @param {Task} task - task to schedule.
   * @param {*} options - task options.
   */
  function ScheduledTask(task, immediateStart) {
    this.task = function () {
      var date = new Date();
      if(timezone){
        date = tzOffset.timeAt(date, timezone);
      }
      this.tick = setTimeout(this.task.bind(this), 
        1000 - date.getMilliseconds());
      task.update(date);
    };

    this.tick = null;

    if (options.scheduled !== false) {
      this.start();
    }
  }

  /**
   * Starts updating the task.
   *
   * @returns {ScheduledTask} instance of this task.
   */
  ScheduledTask.prototype.start = function() {
    if (this.task && !this.tick) {
      this.tick = setTimeout(this.task.bind(this), 1000);
    }

    return this;
  };

  /**
   * Stops updating the task.
   *
   * @returns {ScheduledTask} instance of this task.
   */
  ScheduledTask.prototype.stop = function() {
    if (this.tick) {
      clearTimeout(this.tick);
      this.tick = null;
    }

    return this;
  };

  /**
   * Destoys the scheduled task.
   */
  ScheduledTask.prototype.destroy = function() {
    this.stop();

    this.task = null;
  };

  return ScheduledTask;
}());
