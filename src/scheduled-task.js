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

        this.status = 'idle';

        this.task = new Task(func);
        this.scheduler = new Scheduler(cronExpression, options.timezone, options.recoverMissedExecutions);

        this.scheduler.on('scheduled-time-matched', (now) => {
            this.execute(now);
        });

        if(options.scheduled !== false){
            this.scheduler.start();
        }
        
        if(options.runOnInit === true){
            this.execute();
        }
    }
    
    async execute(now = new Date()) {
      this.status = 'running';
      this.emit('task-starded', now);    
      const result = await this.task.execute(now);
      this.status = 'idle';
      this.emit('task-done', result);
    }
    
    start() {
        this.scheduler.start();  
    }
    
    stop() {
        this.scheduler.stop();
    }

    getStatus() {
        return this.status;
    }
}

export default ScheduledTask;
