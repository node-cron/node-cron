'use strict';

import EventEmitter from 'events';
import Scheduler from './scheduler';
import { v4 } from 'uuid';
import * as storage from './storage';

class ScheduledTask extends EventEmitter {
    options: any;
  status: string;
  func: any;
  scheduler: Scheduler;
    constructor(cronExpression, func, options?) {
        super();
        if(!options){
            options = {
                scheduled: true,
                recoverMissedExecutions: false
            };
        }
      
        this.options = options;
        this.options.name = this.options.name || v4();

        this.status = 'stoped';

        this.func = func;
        this.scheduler = new Scheduler(cronExpression, options.timezone, options.recoverMissedExecutions);

        this.scheduler.on('scheduled-time-matched', (event) => {
            this.execute(event);
        });

        if(options.scheduled !== false){
            this.scheduler.start();
        }
        
        if(options.runOnInit === true){
          this.execute({
            date: new Date(),
            missedExecutions: 0,
            matchedDate: null,
            reason: 'runOnInit'
          });
        }
    }
    
    async execute(event?) {
        if (!event){
            event = {
                date: new Date(),
                missedExecutions: 0,
                matchedDate: null,
                reason: 'manual'
            };
        }
        
        this.status = 'running';
        this.emit('task-started', event);
        event.task = this;  
        const result = await this.func(event);
        this.status = 'idle';
        this.emit('task-done', result);
    }
    
    start() {
      if (this.status === 'destroyed') {
        throw new Error('Task has been destroyed!');
      }

      if(this.status === 'stoped') {
        this.scheduler.start();
        this.emit('scheduler-started');
      }
    }
    
    stop() {
        this.status = 'stoped';
        this.scheduler.stop();
        this.emit('scheduler-stopped');
    }

    getStatus() {
        return this.status;
    }

    destroy() {
        this.stop();
        this.status = 'destroyed';
        this.scheduler.removeAllListeners();
        storage.remove(this.options.name);
        this.emit('scheduler-destroyed');
    }
}

export default ScheduledTask;
