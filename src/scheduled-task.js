'use strict';

const Task = require('./task');
const Scheduler = require('./scheduler');

function ScheduledTask(cronExpressin, func, options) {
  var task = new Task(func);
  var scheduler = new Scheduler(cronExpressin, options.timezone);

  scheduler.on('scheduled-time-matched', (now) => {
    task.execute(now);
  });

  scheduler.start();
}

module.exports = ScheduledTask;
