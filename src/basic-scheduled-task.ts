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
        options = Object.assign({
          scheduled: true,
          catchUp: false
        }, options);
      
        this.options = options;
        this.options.name = this.options.name || randomUUID();

        this.status = 'stopped';

        this.func = func;
        this.scheduler = new Scheduler(cronExpression, options.timezone, options.catchUp);

        this.scheduler.on('scheduled-time-matched', (event) => {
            this.execute(event);
        });

        if(options.scheduled !== false){
            this.scheduler.start();
        }
        
        if(options.runOnStart === true){
          this.execute({
            date: new Date(),
            dateLocalIso: this.scheduler.toLocalizedIso(new Date()),
            missedCount: 0,
            reason: 'runOnStart'
          });
        }

        this.executionCount = 0;
    }
    
    async execute(event?: CronEvent): Promise<any> {
        if (this.options.maxExecutions && this.executionCount >= this.options.maxExecutions - 1) {
          this.emit('task-execution-limit-reached');
          this.destroy();
        }
        
        if (!event){
            const date = new Date();
            event = {
                date: date,
                dateLocalIso: this.scheduler.toLocalizedIso(date),
                missedCount: 0,
                reason: 'manual'
            };
        }
        event.task = this;

        const previousStatus = this.status;
        this.status = 'running';
        this.emit('task-started', event);
        this.executionCount += 1;
        try {
          const result = await this.func(event);
          this.emit('task-done', result);
        } catch(error){
          if (this.options.onError){
            this.emit('task-error', { event, error })
            this.options.onError(error);
          } else {
            throw error;
          }
        }


        if(previousStatus === 'stopped'){
            this.status = 'stopped';
        } else {
          this.status = 'idle';
        }
    }
    
    start() {
      if (this.status === 'destroyed') {
        throw new Error('Task has been destroyed!');
      }

      if(this.status === 'stopped') {
        this.status = 'idle';
        this.scheduler.start();
        this.emit('scheduler-started');
      }
    }
    
    stop() {
        this.status = 'stopped';
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
