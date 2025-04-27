import EventEmitter from 'events';
import { resolve } from 'path';
import { fork } from 'child_process';
import { v4 } from 'uuid';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const daemonPath = `${__dirname}/daemon.js`;

class BackgroundScheduledTask extends EventEmitter {
    constructor(cronExpression, taskPath, options){
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
        this.options.name = this.options.name || v4();
        this.status = 'stoped';

        if(options.scheduled){
            this.start();
        }
    }

    start() {
        if (this.status === 'destroyed') {
          throw new Error('Task has been destroyed!');
        }

        if(this.status !== 'stoped') {
          return;
        }

        this.forkProcess = fork(daemonPath);

        this.forkProcess.on('message', (message) => {
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
                break;
            case 'scheduler-stopped':
                this.stop();
                this.emit('scheduler-stopped');
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

    isChildProcessAlive(){
        return !this.forkProcess.killed;
    }

    getStatus() {
      return this.status;
    }

    destroy() {
        this.status = 'destroyed';
        this.stop();
        this.forkProcess.removeAllListeners();
        storage.remove(this.options.name);
    }
}

export default BackgroundScheduledTask;