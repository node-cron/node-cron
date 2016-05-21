'use strict';

var monthNamesConversion = require('./month-names-conversion');
var weekDayNamesConversion = require('./week-day-names-conversion');
var convertAsterisksToRanges = require('./asterisk-to-range-conversion');
var convertRanges = require('./range-conversion');
var convertSteps = require('./step-values-conversion');

module.exports = (function() {

  function appendSeccondExpression(expressions){
    if(expressions.length === 5){
      return ['0'].concat(expressions);
    }
    return expressions;
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
  function interprete(expression){
    var expressions = expression.split(' ');
    expressions = appendSeccondExpression(expressions);
    expressions[4] = monthNamesConversion(expressions[4]);
    expressions[5] = weekDayNamesConversion(expressions[5]);
    expressions = convertAsterisksToRanges(expressions);
    expressions = convertRanges(expressions);
    expressions = convertSteps(expressions);

    return expressions.join(' ');
  }
  return interprete;
}());
