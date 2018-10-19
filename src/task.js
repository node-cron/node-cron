'use strict';

const EventEmitter = require('events');

class Task extends EventEmitter{
    constructor(execution){
        super();
        if(typeof execution !== 'function'){
            throw 'execution must be a function';
        }

        this.execute = (now) => {
            // TODO: Handle execution
            // check if execution returns a promise
            // emit events on start and on finished
            // force execution return a promise
            return execution(now);
        };
    }
}

module.exports = Task;

