'use strict';

var tzOffset = require('tz-offset');

/**
* Creates a new scheduled task.
*
* @param {Task} task - task to schedule.
* @param {*} options - task options.
*/
function ScheduledTask(task, options) {
  var timezone = options.timezone;
  
  /**
  * Starts updating the task.
  *
  * @returns {ScheduledTask} instance of this task.
  */
  this.start = () => {
    this.status = 'scheduled';
    if (this.task && !this.tick) {
      this.tick = setTimeout(this.task, 1000 - new Date().getMilliseconds() + 1);
    }
    
    return this;
  };
  
  /**
  * Stops updating the task.
  *
  * @returns {ScheduledTask} instance of this task.
  */
  this.stop = () => {
    this.status = 'stoped';
    if (this.tick) {
      clearTimeout(this.tick);
      this.tick = null;
    }
    
    return this;
  };
  
  /**
  * Returns the current task status.
  *
  * @returns {string} current task status.
  * The return may be:
  * - scheduled: when a task is scheduled and waiting to be executed.
  * - running: the task status while the task is executing. 
  * - stoped: when the task is stoped.
  * - destroyed: whe the task is destroyed, in that status the task cannot be re-started.
  * - failed: a task is maker as failed when the previous execution fails.
  */
  this.getStatus = () => {
    return this.status;
  };
  
  /**
  * Destroys the scheduled task.
  */
  this.destroy = () => {
    this.stop();
    this.status = 'destroyed';
    
    this.task = null;
  };
  
  task.on('started', () => {
    this.status = 'running';
  });
  
  task.on('done', () => {
    this.status = 'scheduled';
  });
  
  task.on('failed', () => {
    this.status = 'failed';
  });
  
  this.task = () => {
    var date = new Date();
    if(timezone){
      date = tzOffset.timeAt(date, timezone);
    }
    this.tick = setTimeout(this.task, 1000 - date.getMilliseconds() + 1);
    task.update(date);
  };
  
  this.tick = null;
  
  if (options.scheduled !== false) {
    this.start();
  }
}

module.exports = ScheduledTask;
