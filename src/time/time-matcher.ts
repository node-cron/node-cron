
import convertExpression from '../pattern/convertion/index';
import weekDayNamesConversion from '../pattern/convertion/week-day-names-conversion';
import { LocalizedTime } from './localized-time';

function matchPattern(pattern: string, value:string | number){
    if( pattern.indexOf(',') !== -1 ){
        const patterns = pattern.split(',');
        return patterns.indexOf(value.toString()) !== -1;
    }
    return pattern === value.toString();
}

export class TimeMatcher{
    timezone?: string;
    pattern: string;
    expressions: string[];

    constructor(pattern:string, timezone?:string){
        this.timezone = timezone;
        this.pattern = convertExpression(pattern);
        this.expressions = this.pattern.split(' ');
    }

    match(date: Date){
        const localizedTime = new LocalizedTime(date, this.timezone)
        const parts = localizedTime.getParts();

        const runOnSecond = matchPattern(this.expressions[0], parts.second);
        const runOnMinute = matchPattern(this.expressions[1], parts.minute);
        const runOnHour = matchPattern(this.expressions[2], parts.hour);
        const runOnDay = matchPattern(this.expressions[3], parts.day);
        const runOnMonth = matchPattern(this.expressions[4], parts.month);
        const runOnWeekDay = matchPattern(this.expressions[5], weekDayNamesConversion(parts.weekday));

        return runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekDay;
    }
}
