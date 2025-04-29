'use strict';

import EventEmitter from 'events';
import { ScheduledTask, CronEvent, Options } from './types';
import Scheduler from './scheduler';
import { randomUUID } from 'crypto';
import * as storage from './storage';

class BasicScheduledTask extends EventEmitter implements ScheduledTask {
    options: Options;
    status: string;
    func: Function;
    scheduler: Scheduler;
    executionCount: number;

    constructor(cronExpression: string, func: Function, options?: Options) {
        super();
        if(!options){
            options = {
                scheduled: true,
                recoverMissedExecutions: false
            };
        }
      
        this.options = options;
        this.options.name = this.options.name || randomUUID();

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
            reason: 'runOnInit'
          });
        }

        this.executionCount = 0;
    }
    
    async execute(event?: CronEvent): Promise<any> {
        if (!event){
            event = {
                date: new Date(),
                missedExecutions: 0,
                reason: 'manual'
            };
        }
        
        this.status = 'running';
        this.emit('task-started', event);
        event.task = this;  
        const result = await this.func(event);
        this.status = 'idle';
        this.executionCount += 1;
        this.emit('task-done', result);

        if (this.options.maxExecutions && this.executionCount >= this.options.maxExecutions) {
            this.emit('task-execution-limit-reached');
            this.destroy();
        }
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

export default BasicScheduledTask;
