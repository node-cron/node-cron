'use strict';

const convertExpression = require('./convert-expression');


module.exports = ( () => {
    function isValidExpression(expression, min, max){
        const options = expression.split(',');
        const regexValidation = /^\d+$|^\*$|^\*\/\d+$/;
        for(let i = 0; i < options.length; i++){
            const option = options[i];
            const optionAsInt = parseInt(options[i], 10);
            if(optionAsInt < min || optionAsInt > max || !regexValidation.test(option)) {
                return false;
            }
        }
        return true;
    }

    function isInvalidSecond(expression){
        return !isValidExpression(expression, 0, 59);
    }

    function isInvalidMinute(expression){
        return !isValidExpression(expression, 0, 59);
    }

    function isInvalidHour(expression){
        return !isValidExpression(expression, 0, 23);
    }

    function isInvalidDayOfMonth(expression){
        return !isValidExpression(expression, 1, 31);
    }

    function isInvalidMonth(expression){
        return !isValidExpression(expression, 1, 12);
    }

    function isInvalidWeekDay(expression){
        return !isValidExpression(expression, 0, 7);
    }

    function validateFields(patterns, executablePatterns){
        if (isInvalidSecond(executablePatterns[0])) {
            throw patterns[0] + ' is a invalid expression for second';
        }

        if (isInvalidMinute(executablePatterns[1])) {
            throw patterns[1] + ' is a invalid expression for minute';
        }

        if (isInvalidHour(executablePatterns[2])) {
            throw patterns[2] + ' is a invalid expression for hour';
        }

        if (isInvalidDayOfMonth(executablePatterns[3])) {
            throw patterns[3] + ' is a invalid expression for day of month';
        }

        if (isInvalidMonth(executablePatterns[4])) {
            throw patterns[4] + ' is a invalid expression for month';
        }

        if (isInvalidWeekDay(executablePatterns[5])) {
            throw patterns[5] + ' is a invalid expression for week day';
        }
    }

    function validate(pattern){
        if (typeof pattern !== 'string'){
            throw 'pattern must be a string!';
        }

        let patterns = pattern.split(' ');
        const executablePattern = convertExpression(pattern);
        const executablePatterns = executablePattern.split(' ');

        if(patterns.length === 5){
            patterns = ['0'].concat(patterns);
        }

        validateFields(patterns, executablePatterns);
    }

    return validate;
})();
