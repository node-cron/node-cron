
import convertExpression from '../pattern/convertion';
import { LocalizedTime } from './localized-time';
import { TimeMatcher } from './time-matcher';

import weekDayNamesConversion from '../pattern/convertion/week-day-names-conversion';

export class MatcherWalker{
  cronExpression: string;
  baseDate: Date;
  pattern: any;
  expressions: number[][];
  timeMatcher: TimeMatcher;
  timezone?: string;

  constructor(cronExpression: string, baseDate: Date, timezone?:string){
    this.cronExpression = cronExpression;
    this.baseDate = baseDate;
    this.timeMatcher = new TimeMatcher(cronExpression, timezone);
    this.timezone = timezone;
    
    this.expressions = convertExpression(cronExpression)
  }

  isMatching(){
    return this.timeMatcher.match(this.baseDate);
  }

  matchNext(){
    const findNextDateIgnoringWeekday = () => {
      const baseDate = new Date(this.baseDate.getTime());
      baseDate.setMilliseconds(0);
      const localTime = new LocalizedTime(baseDate, this.timezone);
      const dateParts = localTime.getParts();
      const date = new LocalizedTime(localTime.toDate(), this.timezone);

      const seconds = this.expressions[0];
      const nextSecond = availableValue(seconds, dateParts.second);
      if(nextSecond){
        date.set('second', nextSecond);
        return date;
      }
      date.set('second', seconds[0]);
      
      const minutes = this.expressions[1];
      const nextMinute = availableValue(minutes, dateParts.minute);
      if(nextMinute){
        date.set('minute', nextMinute);
        return date;
      }
      date.set('minute',minutes[0]);


      const hours = this.expressions[2];
      const nextHour = availableValue(hours, dateParts.hour);
      if(nextHour){
        date.set('hour', nextHour);
        return date;
      }
      date.set('hour', hours[0]);

      const days = this.expressions[3];
      const nextDay = availableValue(days, dateParts.day);
      if(nextDay){
        date.set('day',nextDay);
        return date;
      }
      
      date.set('day', days[0]);

      const months = this.expressions[4];
      const nextMonth = availableValue(months, dateParts.month);
      
      if(nextMonth){
        date.set('month', nextMonth);
        return date;
      }
      date.set('year', date.getParts().year + 1);
      date.set('month', months[0]);

      return date;
    }


    const date = findNextDateIgnoringWeekday();
    const weekdays = this.expressions[5];
    
    let currentWeekday = parseInt(weekDayNamesConversion(date.getParts().weekday));

    while(!(weekdays.indexOf(currentWeekday) > -1)){
      date.set('year', date.getParts().year + 1);
      currentWeekday = parseInt(weekDayNamesConversion(date.getParts().weekday));
    }
    return date;
  }
}

function availableValue(values: number[], currentValue: number) : number | false {
  const availableValues = values.sort((a,b) => a - b).filter(s => s > currentValue);
  if(availableValues.length > 0) return availableValues[0];
  return false;
}