'use strict';

const events = require('events');
const util = require('util');

class Task{
  constructor(execution){
    if(typeof execution !== 'function'){
      throw 'execution must be a function'
    }

    events.EventEmitter.call(this);

    this.execute = (now) => {
      // TODO: Handle execution
      // check if execution returns a promise
      // emit events on start and on finished
      // force execution return a promise
      execution(now);
    }
  }
}

util.inherits(Task, events.EventEmitter);

module.exports = Task;

