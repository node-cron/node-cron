'use strict';

import EventEmitter from 'events';
import Task from './task.js';
import Scheduler from './scheduler.js';
import { v4 } from 'uuid';

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
        this.options.name = this.options.name || v4();

        this.task = new Task(func);
        this.scheduler = new Scheduler(cronExpression, options.timezone, options.recoverMissedExecutions);

        this.scheduler.on('scheduled-time-matched', (now) => {
            this.now(now);
        });

        if(options.scheduled !== false){
            this.scheduler.start();
        }
        
        if(options.runOnInit === true){
            this.now('init');
        }
    }
    
    now(now = 'manual') {
        let result = this.task.execute(now);
        this.emit('task-done', result);
    }
    
    start() {
        this.scheduler.start();  
    }
    
    stop() {
        this.scheduler.stop();
    }
}

export default ScheduledTask;
