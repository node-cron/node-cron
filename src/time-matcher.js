const validatePattern = require('./pattern-validation');
const convertExpression = require('./convert-expression');

function matchPattern(pattern, value, year, month){
    if (pattern === 'l' || pattern === 'L') {
        if ([1, 3, 5, 7, 8, 10, 12].indexOf(month) >= 0) {
            return value === 31;
        } else if ([4, 6, 9, 11].indexOf(month) >= 0) {
            return value === 30;
        } else if (month === 2) {
            if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
                return value === 29;
            } else {
                return value === 28;
            }
        } else {
            return pattern === value.toString();
        }
    } else if( pattern.indexOf(',') !== -1 ){
        const patterns = pattern.split(',');
        return patterns.indexOf(value.toString()) !== -1;
    }
    return pattern === value.toString();
}

class TimeMatcher{
    constructor(pattern, timezone){
        validatePattern(pattern);
        this.pattern = convertExpression(pattern);
        this.timezone = timezone;
        this.expressions = this.pattern.split(' ');
    }

    match(date){
        date = this.apply(date);

        const runOnSecond = matchPattern(this.expressions[0], date.getSeconds());
        const runOnMinute = matchPattern(this.expressions[1], date.getMinutes());
        const runOnHour = matchPattern(this.expressions[2], date.getHours());
        const runOnDay = matchPattern(this.expressions[3], date.getDate(), date.getYear(), date.getMonth() + 1);
        const runOnMonth = matchPattern(this.expressions[4], date.getMonth() + 1);
        const runOnWeekDay = matchPattern(this.expressions[5], date.getDay());

        return runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekDay;
    }

    apply(date){
        if(this.timezone){
            const dtf = new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hourCycle: 'h23',
                fractionalSecondDigits: 3,
                timeZone: this.timezone
            });
            
            return new Date(dtf.format(date));
        }
        
        return date;
    }
}

module.exports = TimeMatcher;