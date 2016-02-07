'use strict';

var Task = require('./task');

module.exports = {
  schedule : function(pattern, task){
    var task = new Task(pattern, task);
    var execution = function(){
      var time = new Date();
      task.update(time);
    };

    setInterval(execution, 1000);
  }
};
