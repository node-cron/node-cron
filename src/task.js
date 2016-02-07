'use strict';

var interpretPattern = require('./pattern-interpreter');
var validatePattern = require('./pattern-validation');

module.exports = (function(){
  function matchPattern(pattern, value){
    var multiplePattern = /\*\/(\d+)/g;
    var match = multiplePattern.exec(pattern);
    var isPartialMatch = match !== null && match.length > 0;
    if (pattern === '*') return true;
    if (isPartialMatch)
      return value % parseInt(match[1]) === 0;
    else if( pattern.indexOf(',') !== -1 ){
      var patterns = pattern.split(',');
      return patterns.indexOf(value.toString()) !== -1;
    } else
      return pattern === value.toString();
  };

  function mustRun(task, date){
    var runInSecond = matchPattern(task.expressions[0], date.getSeconds());
    var runOnMinute = matchPattern(task.expressions[1], date.getMinutes());
    var runOnHour   = matchPattern(task.expressions[2], date.getHours());
    var runOnDayOfMonth = matchPattern(task.expressions[3], date.getDate());
    var runOnMonth = matchPattern(task.expressions[4], date.getMonth() + 1);
    var weekDay = date.getDay();
    if (weekDay === 0 ) weekDay = 7;
    var runOnDayOfWeek = matchPattern(task.expressions[5], weekDay);
    return runInSecond && runOnMinute && runOnHour && runOnDayOfMonth &&
      runOnMonth && runOnDayOfWeek;
  }

  function Task(pattern, execution){
    validatePattern(pattern);
    this.pattern = interpretPattern(pattern);
    this.execution = execution;
    this.expressions = this.pattern.split(' ');
    if (this.expressions.length === 5 )
      this.expressions = [ '0' ].concat(this.expressions);
  }

  Task.prototype.update = function(date){
    if(mustRun(this, date)){
      try{
        this.execution();
      } catch(err) {
        console.error(err);
      }
    }
  }

  return Task;
})();
