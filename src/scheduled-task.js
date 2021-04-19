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
                runOnInit: false,
                recoverMissedExecutions: false
            };
        }
        let task = new Task(func);
        let scheduler = new Scheduler(cronExpression, options.timezone, options.recoverMissedExecutions);

        scheduler.on('scheduled-time-matched', (now) => {
            this.now(now);
        });

        if(options.scheduled !== false){
            scheduler.start();
        }
        
        if(options.runOnInit === true){
            this.now('init');
        }

        this.start = () => {
            scheduler.start();
        };
        
        this.now = (now = 'manual') => {
            let result = task.execute(now);
            this.emit('task-done', result);
        };

        this.stop = () => {
            scheduler.stop();
        };
    }
}

module.exports = ScheduledTask;
