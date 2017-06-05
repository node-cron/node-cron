'use strict';
module.exports = (function() {
  function replaceWithRange(expression, text, init, end) {

    var numbers = [];
    var last = parseInt(end);
    var first = parseInt(init);

    if(first > last){
      last = parseInt(init);
      first = parseInt(end);
    }

    for(var i = first; i <= last; i++) {
      numbers.push(i);
    }

    return expression.replace(new RegExp(text, 'gi'), numbers.join());
  }

  function convertRange(expression){
    var rangeRegEx = /(\d+)\-(\d+)/;
    var match = rangeRegEx.exec(expression);
    while(match !== null && match.length > 0){
      expression = replaceWithRange(expression, match[0], match[1], match[2]);
      match = rangeRegEx.exec(expression);
    }
    return expression;
  }

  function convertAllRanges(expressions){
    for(var i = 0; i < expressions.length; i++){
      expressions[i] = convertRange(expressions[i]);
    }
    return expressions;
  }

  return convertAllRanges;
}());



