'use strict';

const Task = require('./task');
const Scheduler = require('./scheduler');
const EventEmitter = require('events');

class ScheduledTask extends EventEmitter{
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
            this.emit('task-started');
            Promise.resolve(task.execute(now)).then((value) => this.emit('task-finished', value));
        });

        if(options.scheduled !== false){
            scheduler.start();
        }

        this.start = () => {
            scheduler.start();
        };

        this.stop = () => {
            scheduler.stop();
        };
    }
}

module.exports = ScheduledTask;
