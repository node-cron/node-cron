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
    expression = convertWeekDayName(expression, weekDays);
    expression = convertWeekDayName(expression, shortWeekDays);
    expression = convertRanges(expression);
    return expression;
  }

  return interpretExpression;
}());

