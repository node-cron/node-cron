'use strict';

var Task = require('./task');

module.exports = (function(){
  function createTask(expression, func){
    var task = new Task(expression, func);
    setInterval(function(){
      task.update(new Date());
    }, 1000);
  }
  return {
    schedule: createTask
  }
})();
