import validatePattern from './pattern-validation/pattern-validation';
import convertExpression from './convert-expression/index';
import weekDayNamesConversion from './convert-expression/week-day-names-conversion';

function matchPattern(pattern: string, value:string | number){
    if( pattern.indexOf(',') !== -1 ){
        const patterns = pattern.split(',');
        return patterns.indexOf(value.toString()) !== -1;
    }
    return pattern === value.toString();
}

class TimeMatcher{
    timezone?: string;
    pattern: string;
    expressions: string[];
    dtf: Intl.DateTimeFormat;

    constructor(pattern:string, timezone?:string){
        const dftOptions: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'short',
          hour12: false,
        }

        if(timezone){
            this.timezone = timezone;
            dftOptions.timeZone = timezone;
        }

        validatePattern(pattern);
        this.pattern = convertExpression(pattern);
        this.expressions = this.pattern.split(' ');
        this.dtf = new Intl.DateTimeFormat('en-US', dftOptions);
    }

    match(date: Date){
        const parts = this.dtf.formatToParts(date).filter(part => {
            return part.type !== 'literal';
        }).reduce((acc:any, part) => {
            acc[part.type] = part.value;
            return acc;
        }, {});

        const runOnSecond = matchPattern(this.expressions[0], parseInt(parts.second));
        const runOnMinute = matchPattern(this.expressions[1], parseInt(parts.minute));
        const runOnHour = matchPattern(this.expressions[2], parseInt(parts.hour));
        const runOnDay = matchPattern(this.expressions[3], parseInt(parts.day));
        const runOnMonth = matchPattern(this.expressions[4], parseInt(parts.month));
        const runOnWeekDay = matchPattern(this.expressions[5], weekDayNamesConversion(parts.weekday));
      
        return runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekDay;
    }
}

export default TimeMatcher;
