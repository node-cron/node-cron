'use strict';

const EventEmitter = require('events');
const Task = require('./task');
const Scheduler = require('./scheduler');
const TimeMatcher = require('./time-matcher');
const uuid = require('uuid');

class ScheduledTask extends EventEmitter {
    constructor(cronExpression, func, options) {
        super();
        if(!options){
            options = {
                scheduled: true,
                recoverMissedExecutions: false
            };
        }
      
        this.options = options;
        this.options.name = this.options.name || uuid.v4();
        this._lastExecutions = new Map();

        this._task = new Task(func);
        this._scheduler = new Scheduler(cronExpression, options.timezone);

        const timeMatcher = new TimeMatcher(cronExpression, options.timezone);
        this._firstExecution = timeMatcher.apply(new Date());

        this._scheduler.on('scheduled-time-matched', (now) => {
            this.now(now);
        });

        this._task.on('task-finished', ({now}) => { 
            if (this._lastExecutions.size > 9999999) this._lastExecutions = new Map();
            now && this._lastExecutions.set(new Date(now).getTime(), true);
        });

        this._task.on('task-failed', ({now}) => { 
            options.recoverMissedExecutions && setTimeout(() =>this.now(now), 1000);
        });

        if(options.scheduled !== false){
            this._scheduler.start();
        }
        
        if(options.runOnInit === true){
            this.now('init');
        }
    }
    
    now(now = 'manual') {
        if (now) this._lastExecutions.set(new Date(now).getTime(), false);
        else this._lastExecutions.set(new Date(this._firstExecution).getTime(), true);
        let result = this._task.execute(now);
        this.emit('task-done', result);
    }
    
    start() {
        this._scheduler.start();  
    }
    
    stop() {
        this._scheduler.stop();
    }
}

module.exports = ScheduledTask;
