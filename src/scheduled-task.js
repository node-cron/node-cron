'use strict';

const EventEmitter = require('events');
const Task = require('./task');
const Scheduler = require('./scheduler');

class ScheduledTask extends EventEmitter {
    constructor(cronExpression, func, options) {
        super();
        if(!options){
            options = {
                scheduled: true,
                recoverMissedExecutions: false
            };
        }
        let task = new Task(func);
        let scheduler = new Scheduler(cronExpression, options.timezone, options.recoverMissedExecutions);

        scheduler.on('scheduled-time-matched', (now) => {
            let result = task.execute(now);
            this.emit('task-done', result);
        });

        if(options.scheduled !== false){
            scheduler.start();
        }

        this.start = () => {
            scheduler.start();
        };

        this.setSchedule = (cronExpression) => {
            scheduler.setSchedule(cronExpression);
        }

        this.stop = () => {
            scheduler.stop();
        };
    }
}

module.exports = ScheduledTask;
