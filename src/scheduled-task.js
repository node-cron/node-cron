'use strict';

var tzOffset = require('tz-offset');

module.exports = (function() {

  /**
   * Creates a new scheduled task.
   *
   * @param {Task} task - task to schedule.
   * @param {*} options - task options.
   */
  function ScheduledTask(task, options) {

    var timezone = options.timezone;
    var self = this;

    task.on('started', function() {
      self.status = 'running';
    });

    task.on('done', function() {
      self.status = 'waiting';
    });

    task.on('failed', function() {
      self.status = 'failed';
    });

    this.task = function() {
      var date = new Date();
      if(timezone){
        date = tzOffset.timeAt(date, timezone);
      }
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
    this.status = 'waiting';
    if (this.task && !this.tick) {
      this.tick = setInterval(this.task, 1000);
    }

    return this;
  };

  /**
   * Stops updating the task.
   *
   * @returns {ScheduledTask} instance of this task.
   */
  ScheduledTask.prototype.stop = function() {
    this.status = 'stoped';
    if (this.tick) {
      clearInterval(this.tick);
      this.tick = null;
    }

    return this;
  };

  /**
   * Destoys the scheduled task.
   */
  ScheduledTask.prototype.destroy = function() {
    this.status = 'destroyed';
    this.stop();

    this.task = null;
  };

  return ScheduledTask;
}());
