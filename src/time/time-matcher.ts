
import convertExpression from '../pattern/convertion/index';
import weekDayNamesConversion from '../pattern/convertion/week-day-names-conversion';
import { LocalizedTime } from './localized-time';
import { MatcherWalker } from './matcher-walker';
import { matchesDayOfMonth } from './day-of-month';

function matchValue(allowedValues: number[], value: number){
  return allowedValues.indexOf(value) !== -1;
}

export class TimeMatcher{
    timezone?: string;
    utcOffset?: number;
    pattern: string;
    expressions: any[];

    constructor(pattern:string, timezone?:string, utcOffset?:number){
        this.timezone = timezone;
        this.utcOffset = utcOffset;
        this.pattern = pattern
        this.expressions = convertExpression(pattern);
    }

    match(date: Date){
        const localizedTime = new LocalizedTime(date, this.timezone, this.utcOffset)
        const parts = localizedTime.getParts();
        const runOnSecond = matchValue(this.expressions[0], parts.second);
        const runOnMinute = matchValue(this.expressions[1], parts.minute);
        const runOnHour = matchValue(this.expressions[2], parts.hour);
        const runOnDay = matchesDayOfMonth(this.expressions[3], parts.year, parts.month, parts.day);
        const runOnMonth = matchValue(this.expressions[4], parts.month);
        const runOnWeekDay = matchValue(this.expressions[5], parseInt(weekDayNamesConversion(parts.weekday)));

        return runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekDay;
    }

    getNextMatch(date: Date){
      const walker = new MatcherWalker(this.pattern, date, this.timezone, this.utcOffset);
      const next = walker.matchNext();
      return next.toDate();
    }
}
