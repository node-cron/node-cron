'use strict';

var months = ['january','february','march','april','may','june','july',
  'august','september','october','november','december'];
var shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug',
  'sep', 'oct', 'nov', 'dec'];
var weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday']
var shortWeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/*
 * The node-cron core allows only numbers (including multiple numbers e.g 1,2).
 * This module is going to translate the month names, week day names and ranges
 * to integers relatives.
 *
 * Month names example:
 *  - Pattern 0 1 1 January,Sep *
 *  - Will be translated to 0 1 1 1,9 *
 *
 * Week day names example:
 *  - Pattern 0 1 1 2 Monday,Sat
 *  - Will be translated to 0 1 1 1,5 *
 *
 * Ranges example:
 *  - Pattern 1-5 * * * *
 *  - Will be translated to 1,2,3,4,5 * * * *
 */
function interpretPattern(pattern){
  var convertMonthName = function(pattern, items){
    for(var i = 0; i < items.length; i++)
      pattern = pattern.replace(new RegExp(items[i], 'gi'), parseInt(i, 10) + 1);
    return pattern;
  }

  var convertWeekDayName = function(pattern, items){
    for(var i = 0; i < items.length; i++)
      pattern = pattern.replace(new RegExp(items[i], 'gi'), parseInt(i, 10));
    return pattern;
  }

  var convertRanges = function(pattern){
    var rangeRegEx = /(\d+)\-(\d+)/
    var match = rangeRegEx.exec(pattern);
    while(match !== null && match.length > 0){
      var rangeText = match[0];
      var init = match[1];
      var end  = match[2];
      var numbers = [];
      for(var i = init; i <= end; i++)
        numbers.push(i);
      pattern = pattern.replace(new RegExp(rangeText, 'gi'), numbers.join());
      match = rangeRegEx.exec(pattern);
    }
    return pattern;
  }

  pattern = convertMonthName(pattern, months);
  pattern = convertMonthName(pattern, shortMonths);
  pattern = convertWeekDayName(pattern, weekDays);
  pattern = convertWeekDayName(pattern, shortWeekDays);
  pattern = convertRanges(pattern);
  return pattern;
}

module.exports = interpretPattern;
