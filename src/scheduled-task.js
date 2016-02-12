'use strict';

module.exports = (function(){
  function ScheduledTask(task){
    this.task = task;
    this.running = false;
    this.start();
  }

  ScheduledTask.prototype.start = function(){
    if(!this.running){
      var self = this;
      this.timerId = setInterval(function(){
        self.task.update(new Date());
      }, 1000);
    }
  }

  ScheduledTask.prototype.stop = function(){
    if(this.timerId)
      clearInterval(this.timerId);
  }

  return ScheduledTask;
}());
