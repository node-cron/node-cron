'use strict';

const events = require('events');
const util = require('util');

class Task{
    constructor(execution){
        if(typeof execution !== 'function'){
            throw 'execution must be a function';
        }
        events.EventEmitter.call(this);
        this.execute = execution;
    }
}

util.inherits(Task, events.EventEmitter);

module.exports = Task;

