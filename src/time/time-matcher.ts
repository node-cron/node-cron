
import convertExpression from '../pattern/conversion/index';
import weekDayNamesConversion from '../pattern/conversion/week-day-names-conversion';
import { LocalizedTime } from './localized-time';
import { MatcherWalker } from './matcher-walker';
import { matchesDayOfMonth } from './day-of-month';
import { matchesDayOfWeek } from './day-of-week';

function matchValue(allowedValues: number[], value: number){
  return allowedValues.indexOf(value) !== -1;
}

export class TimeMatcher{
    timezone?: string;
    pattern: string;
    expressions: any[];

    constructor(pattern:string, timezone?:string){
        this.timezone = timezone;
        this.pattern = pattern 
        this.expressions = convertExpression(pattern);
    }

    match(date: Date){
        const localizedTime = new LocalizedTime(date, this.timezone)
        const parts = localizedTime.getParts();
        const runOnSecond = matchValue(this.expressions[0], parts.second);
        const runOnMinute = matchValue(this.expressions[1], parts.minute);
        const runOnHour = matchValue(this.expressions[2], parts.hour);
        const runOnDay = matchesDayOfMonth(this.expressions[3], parts.year, parts.month, parts.day);
        const runOnMonth = matchValue(this.expressions[4], parts.month);
        const weekday = parseInt(weekDayNamesConversion(parts.weekday));
        const runOnWeekDay = matchesDayOfWeek(this.expressions[5], parts.year, parts.month, parts.day, weekday);

        return runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekDay;
    }

    getNextMatch(date: Date){
      const walker = new MatcherWalker(this.pattern, date, this.timezone);
      const next = walker.matchNext();
      return next.toDate();
    }
}
