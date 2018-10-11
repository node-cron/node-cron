'use strict';


var events = require('events');

function Task(execution){
  if(typeof execution !== 'function'){
    throw 'execution must be a function'
  }

  events.EventEmitter.call(this);

  this.execute = (now) => {
    execution(now);
  }
}

Task.prototype = events.EventEmitter.prototype;


module.exports = Task;

