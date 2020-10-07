'use strict';

const EventEmitter = require('events');
const Task = require('./task');
const Scheduler = require('./scheduler');

class ScheduledTask extends EventEmitter {
    constructor(cronExpression, func, { timezone, scheduled = true, recoverMissedExecutions = false, args = [] } = {}) {
        super();
        let task = new Task(func);
        let scheduler = new Scheduler(cronExpression, timezone, recoverMissedExecutions);

        scheduler.on('scheduled-time-matched', (now, ...args) => {
            let result = task.execute(now, ...args);
            this.emit('task-done', result);
        });

        if(scheduled !== false){
            scheduler.start(...args);
        }

        this.start = (...args) => {
            scheduler.start(...args);
        };

        this.stop = () => {
            scheduler.stop();
        };
    }
}

module.exports = ScheduledTask;
