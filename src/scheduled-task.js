'use strict';

const Task = require('./task');
const Scheduler = require('./scheduler');

class ScheduledTask {
  constructor(cronExpression, func, options) {
    if(!options){
      options = {
        scheduled: true
      }
    }
    let task = new Task(func);
    let scheduler = new Scheduler(cronExpression, options.timezone);

    scheduler.on('scheduled-time-matched', (now) => {
      task.execute(now);
    });

    if(options.scheduled !== false){
      scheduler.start();
    }

    this.start = () => {
      scheduler.start();
    }

    this.stop = () => {
      scheduler.stop();
    }
  }
}

module.exports = ScheduledTask;
