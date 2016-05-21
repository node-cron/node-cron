'use strict';

module.exports = (function() {
  var months = ['january','february','march','april','may','june','july',
  'august','september','october','november','december'];
  var shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug',
  'sep', 'oct', 'nov', 'dec'];
  var weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday'];
  var shortWeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];


  function convertMonthName(expression, items){
    for(var i = 0; i < items.length; i++){
      expression = expression.replace(new RegExp(items[i], 'gi'), parseInt(i, 10) + 1);
    }
    return expression;
  }

  function convertWeekDay(expression){
    var expressions = expression.split(' ');
    if (expressions[5] === '7'){
      expressions[5] = '0';
    }
    expression = expressions.join(' ');
    expression = convertWeekDayName(expression, weekDays);
    return convertWeekDayName(expression, shortWeekDays);
  }

  function convertWeekDayName(expression, items){
    for(var i = 0; i < items.length; i++){
      expression = expression.replace(new RegExp(items[i], 'gi'), parseInt(i, 10));
    }
    return expression;
  }

  function replaceWithRange(expression, text, init, end) {
    var numbers = [];
    for(var i = init; i <= end; i++) {
      numbers.push(i);
    }
    return expression.replace(new RegExp(text, 'gi'), numbers.join());
  }

  function convertRanges(expression){
    var rangeRegEx = /(\d+)\-(\d+)/;
    var match = rangeRegEx.exec(expression);
    while(match !== null && match.length > 0){
      expression = replaceWithRange(expression, match[0], match[1], match[2]);
      match = rangeRegEx.exec(expression);
    }
    return expression;
  }

  function convertAsterisk(expression, index, replecement){
    var expressions = expression.split(' ');
    if(expressions.length == 5){
      expressions = ['0'].concat(expressions);
    }
    if(expressions[index] === '*'){
      expressions[index] = replecement;
    }
    return expressions.join(' ');
  }

  function convertAsteriskToRange(expression){
    expression = convertAsterisk(expression, 0, '0-59');
    expression = convertAsterisk(expression, 1, '0-59');
    expression = convertAsterisk(expression, 2, '0-23');
    expression = convertAsterisk(expression, 3, '1-31');
    expression = convertAsterisk(expression, 4, '1-12');
    expression = convertAsterisk(expression, 5, '0-6');
    return expression;
  }

  /*
   * The node-cron core allows only numbers (including multiple numbers e.g 1,2).
   * This module is going to translate the month names, week day names and ranges
   * to integers relatives.
   *
   * Month names example:
   *  - expression 0 1 1 January,Sep *
   *  - Will be translated to 0 1 1 1,9 *
   *
   * Week day names example:
   *  - expression 0 1 1 2 Monday,Sat
   *  - Will be translated to 0 1 1 1,5 *
   *
   * Ranges example:
   *  - expression 1-5 * * * *
   *  - Will be translated to 1,2,3,4,5 * * * *
   */
   function interpretExpression(expression){
    expression = convertMonthName(expression, months);
    expression = convertMonthName(expression, shortMonths);
    expression = convertWeekDay(expression);
    expression = convertAsteriskToRange(expression);
    expression = convertRanges(expression);
    return expression;
  }

  return interpretExpression;
}());

