'use strict';

module.exports = (function() {
  function convertSteps(expressions){
    var stepValuePattern = /^(.+)\/(\d+)$/;
    for(var i = 0; i < expressions.length; i++){
      var match = stepValuePattern.exec(expressions[i]);
      var isStepValue = match !== null && match.length > 0;
      if(isStepValue){
        var values = match[1].split(',');
        var setpValues = [];
        var divider = parseInt(match[2], 10);
        for(var j = 0; j <= values.length; j++){
          var value = parseInt(values[j], 10);
          if(value % divider === 0){
            setpValues.push(value);
          }
        }
        expressions[i] = setpValues.join(',');
      }
    }
    return expressions;
  }

  return convertSteps;
}());

