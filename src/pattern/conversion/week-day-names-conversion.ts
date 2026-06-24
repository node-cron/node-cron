export default (() => {
    const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday',
        'friday', 'saturday'];
    const shortWeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    function convertWeekDayName(expression, items){
        for(let i = 0; i < items.length; i++){
            expression = expression.replace(new RegExp(items[i], 'gi'), i);
        }
        return expression;
    }
  
    function convertWeekDays(expression){
        expression = convertWeekDayName(expression, weekDays);
        return convertWeekDayName(expression, shortWeekDays);
    }

    return convertWeekDays;
})();
