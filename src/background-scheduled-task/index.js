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

        if(options.scheduled){
            this.start();
        }
    }

    start() {
        this.stop();
        this.forkProcess = fork(daemonPath);

        this.forkProcess.on('message', (message) => {
            switch(message.type){
            case 'task-done':
                this.emit('task-done', message.result);
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
        if(this.forkProcess){
            this.forkProcess.kill();
        }
    }

    pid() {
        if(this.forkProcess){
            return this.forkProcess.pid;
        }
    }

    isRunning(){
        return !this.forkProcess.killed;
    }
}

export default BackgroundScheduledTask;