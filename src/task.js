'use strict';

const EventEmitter = require('events');

class Task extends EventEmitter{
    constructor(execution){
        super();
        if(typeof execution !== 'function') {
            throw 'execution must be a function';
        }
        this._execution = execution;
    }

    execute(now) {
        let exec;
        try {
            exec = this._execution(now);
        } catch (error) {
            return this.emit('task-failed', {error, now});
        }
        
        if (exec instanceof Promise) {
            return exec
                .then(() => this.emit('task-finished', {now}))
                .catch((error) => this.emit('task-failed', {error, now}));
        } else {
            this.emit('task-finished', {now});
            return exec;
        }
    }
}

module.exports = Task;

