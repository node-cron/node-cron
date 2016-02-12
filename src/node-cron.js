'use strict';

var Task = require('./task');
var ScheduledTask = require('./scheduled-task');

module.exports = (function(){
  function createTask(expression, func){
    var task = new Task(expression, func);
    return new ScheduledTask(task);
  }

  return {
    schedule: createTask
  }
}());
