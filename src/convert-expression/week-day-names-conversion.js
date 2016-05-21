'use strict';
module.exports = (function() {
  var weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday'];
  var shortWeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  function convertWeekDays(expression){
    expression = expression.replace('7', '0');
    expression = convertWeekDayName(expression, weekDays);
    return convertWeekDayName(expression, shortWeekDays);
  }

  function convertWeekDayName(expression, items){
    for(var i = 0; i < items.length; i++){
      expression = expression.replace(new RegExp(items[i], 'gi'), parseInt(i, 10));
    }
    return expression;
  }

  return convertWeekDays;
}());
