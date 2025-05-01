'use strict';

import EventEmitter from 'events';
import { Options } from './types';
import Scheduler from './scheduler';
import { randomUUID } from 'crypto';
import * as storage from './storage';
import { LocalizedTime } from './time/localized-time';
import { ScheduledTask } from './tasks/scheduled-task';
import { TaskEvent } from './tasks/task-event';

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
            this.start();
        }
        
        if(options.runOnStart === true){
          const localTime = new LocalizedTime(new Date(), this.options.timezone);
          this.execute({
            date: localTime.toDate(),
            dateLocalIso: localTime.toISO(),
            missedCount: 0,
            reason: 'initial'
          });
        }

        this.executionCount = 0;
    }
    
     async execute(event?: TaskEvent): Promise<any> {
        if(this.options.noOverlap && this.status === 'running'){
          this.emit('task-already-running', this)
          return;
        }

        if (this.options.maxExecutions && this.executionCount >= this.options.maxExecutions - 1) {
          this.emit('task-execution-limit-reached', true);
          this.destroy();
        }

        if (!event){
            const localTime = new LocalizedTime(new Date(), this.options.timezone);
            event = {
                date: localTime.toDate(),
                dateLocalIso: localTime.toISO(),
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
          if(previousStatus === 'stopped'){
            this.status = 'stopped';
          } else {
            this.status = 'idle';
          }
        } catch (error){
          if(previousStatus === 'stopped'){
            this.status = 'stopped';
          } else {
            this.status = 'idle';
          }
          this.emit('task-error', event, error)
          if (this.options.onError){
            this.options.onError(error);
          } else {
            throw error;
          }
        }
    }
    
    start() {
      if (this.status === 'destroyed') {
        throw new Error('Task has been destroyed!');
      }
      if(this.status === 'stopped') {
        this.status = 'idle';
        this.scheduler.start();
        this.emit('scheduler-started', true);
      }
    }
    
    stop() {
        this.status = 'stopped';
        this.scheduler.stop();
        this.emit('scheduler-stopped', true);
    }

    getStatus() {
        return this.status;
    }

    destroy() {
        this.stop();
        this.status = 'destroyed';
        this.scheduler.removeAllListeners();
        storage.remove(this.options.name);
        this.emit('scheduler-destroyed', true);
    }
}

export default BasicScheduledTask;
