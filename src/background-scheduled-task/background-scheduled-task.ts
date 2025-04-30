import EventEmitter from 'events';
import { resolve } from 'path';
import { fork, ChildProcess} from 'child_process';
import { randomUUID } from 'crypto';

import {remove} from '../storage';
import { ScheduledTask, CronEvent } from '../types';

const daemonPath = resolve(__dirname, 'daemon.js');

class BackgroundScheduledTask extends EventEmitter implements ScheduledTask{
    cronExpression: any;
  taskPath: any;
  options: any;
  status: string;
  forkProcess?: ChildProcess;

    constructor(cronExpression, taskPath, options?){
        super();
        if(!options){
            options = {
                scheduled: true,
                catchUp: false,
            };
        }
        this.cronExpression = cronExpression;
        this.taskPath = taskPath;
        this.options = options;
        this.options.name = this.options.name || randomUUID();
        this.status = 'stopped';

        if(options.scheduled){
            this.start();
        }
    }

    execute(event?: CronEvent): Promise<any> {
      return new Promise((resolve, reject) => {
        if(this.forkProcess){
          this.forkProcess.send({
              type: 'execute',
              event: event
          });

          this.forkProcess.once('message', (message:any) => {
              switch(message.type){
              case 'task-done':
                  resolve(message.result);
                  break;
              }
            }
          );
        }

        reject(new Error('Task is not running!'));
      });
    }  

    async start() {
        if (this.status === 'destroyed') {
          throw new Error('Task has been destroyed!');
        }

        if(this.status !== 'stopped') {
          return;
        }

        this.forkProcess = fork(daemonPath);

        this.forkProcess.on('message', (message:any) => {
            switch(message.type){
            case 'task-started':
                this.status = 'running';
                this.emit('task-started', message.time);
                break;
            case 'task-done':
                this.status = 'idle';
                this.emit('task-done', message.result);
                break;
            case 'scheduler-started':
                this.start();
                this.emit('scheduler-started');
                break;
            case 'scheduler-stopped':
                this.stop();
                this.emit('scheduler-stopped');
                break;
            case 'scheduler-destroyed':
                this.destroy();
                this.emit('scheduler-destroyed');
                break;
            }
        });

        let options = this.options;
        options.scheduled = true;
        
        this.forkProcess.send({
            type: 'register',
            path: resolve(this.taskPath),
            cron: this.cronExpression,
            options: options
        });
    }
    
    stop(){
        this.status = 'stopped';
        if(this.forkProcess){
            this.forkProcess.kill();
        }
    }

    pid() {
        if(this.forkProcess){
            return this.forkProcess.pid;
        }
    }

    getStatus() {
      return this.status;
    }

    destroy() {
        this.status = 'destroyed';
        this.stop();
        if (this.forkProcess) {
            this.forkProcess.removeAllListeners();
        }
        remove(this.options.name);
    }
}

export default BackgroundScheduledTask;