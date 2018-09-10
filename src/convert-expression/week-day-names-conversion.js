'use strict';
module.exports = (() => {
  var weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday'];
  var shortWeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  function convertWeekDayName(expression, items){
    for(var i = 0; i < items.length; i++){
      expression = expression.replace(new RegExp(items[i], 'gi'), parseInt(i, 10));
    }
    return expression;
  }
  
  function convertWeekDays(expression){
    expression = expression.replace('7', '0');
    expression = convertWeekDayName(expression, weekDays);
    return convertWeekDayName(expression, shortWeekDays);
  }

  return convertWeekDays;
})();
