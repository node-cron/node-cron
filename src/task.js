'use strict';

var convertExpression = require('./convert-expression');
var validatePattern = require('./pattern-validation');

module.exports = (function(){
  function matchPattern(pattern, value){
    if( pattern.indexOf(',') !== -1 ){
      var patterns = pattern.split(',');
      return patterns.indexOf(value.toString()) !== -1;
    }
    return pattern === value.toString();
  }

  function mustRun(task, date){
    var runInSecond = matchPattern(task.expressions[0], date.getSeconds());
    var runOnMinute = matchPattern(task.expressions[1], date.getMinutes());
    var runOnHour   = matchPattern(task.expressions[2], date.getHours());
    var runOnDayOfMonth = matchPattern(task.expressions[3], date.getDate());
    var runOnMonth = matchPattern(task.expressions[4], date.getMonth() + 1);
    var runOnDayOfWeek = matchPattern(task.expressions[5], date.getDay());
    return runInSecond && runOnMinute && runOnHour && runOnDayOfMonth &&
      runOnMonth && runOnDayOfWeek;
  }

  function Task(pattern, execution){
    validatePattern(pattern);
    this.pattern = convertExpression(pattern);
    this.execution = execution;
    this.expressions = this.pattern.split(' ');
  }

  Task.prototype.update = function(date){
    if(mustRun(this, date)){
      try {
        this.execution();
      } catch(err) {
        console.error(err);
      }
    }
  };

  return Task;
}());
