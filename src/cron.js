'use strict';
module.exports = {
  schedule : function(pattern, task){
    function execution(){
      var time = new Date();
      var patterns = pattern.split(' ');
      if (patterns.length === 5 )
        patterns = [ '0' ].concat(patterns);
      var runInSecond = matchPattern(patterns[0], time.getSeconds());
      var runOnMinute = matchPattern(patterns[1], time.getMinutes());
      var runOnHour   = matchPattern(patterns[2], time.getHours());
      var runOnDayOfMonth = matchPattern(patterns[3], time.getDate());
      var runOnMonth = matchPattern(patterns[4], time.getMonth() + 1);
      var weekDay = time.getDay();
      if (weekDay === 0 ) weekDay = 7;
      var runOnDayOfWeek = matchPattern(patterns[5], weekDay);

      if (runInSecond && runOnMinute && runOnHour &&
        runOnDayOfMonth && runOnMonth && runOnDayOfWeek)
        try{
          task();
        } catch(err) {
          console.error(err);
        }
    }

    var matchPattern = function(pattern, value){
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

    setInterval(execution, 1000);
  }
};
