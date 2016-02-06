'use strict';

var months = ['january','february','march','april','may','june','july',
  'august','september','october','november','december'];

var shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug',
  'sep', 'oct', 'nov', 'dec'];

var weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday']

var shortWeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function interpretPattern(pattern){
  var convertMonthName = function(pattern, items){
    for(var i in items)
      pattern = pattern.replace(new RegExp(items[i], 'gi'), parseInt(i) + 1);
    return pattern;
  }

  var convertWeekDayName = function(pattern, items){
    for(var i in items)
      pattern = pattern.replace(new RegExp(items[i], 'gi'), parseInt(i));
    return pattern;
  }

  pattern = convertMonthName(pattern, months);
  pattern = convertMonthName(pattern, shortMonths);
  pattern = convertWeekDayName(pattern, weekDays);
  pattern = convertWeekDayName(pattern, shortWeekDays);
  return pattern;
}


module.exports = interpretPattern;
