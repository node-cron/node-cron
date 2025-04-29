import EventEmitter from 'events';
import { resolve } from 'path';
import { fork, ChildProcess} from 'child_process';
import { randomUUID } from 'crypto';

import {remove} from '../storage';

const daemonPath = resolve(__dirname, 'daemon.js');

class BackgroundScheduledTask extends EventEmitter {
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
                recoverMissedExecutions: false,
            };
        }
        this.cronExpression = cronExpression;
        this.taskPath = taskPath;
        this.options = options;
        this.options.name = this.options.name || randomUUID();
        this.status = 'stoped';

        if(options.scheduled){
            this.start();
        }
    }

    async start() {
        if (this.status === 'destroyed') {
          throw new Error('Task has been destroyed!');
        }

        if(this.status !== 'stoped') {
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
        this.status = 'stoped';
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