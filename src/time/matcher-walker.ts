
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

  matchIgnoringWeekday(localizedTime: LocalizedTime): boolean {
    const parts = localizedTime.getParts();
    const runOnSecond = this.expressions[0].indexOf(parts.second) !== -1;
    const runOnMinute = this.expressions[1].indexOf(parts.minute) !== -1;
    const runOnHour = this.expressions[2].indexOf(parts.hour) !== -1;
    const runOnDay = this.expressions[3].indexOf(parts.day) !== -1;
    const runOnMonth = this.expressions[4].indexOf(parts.month) !== -1;
    
    return runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth;
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
        if(this.matchIgnoringWeekday(date)){
          return date;
        }
      }
      date.set('second', seconds[0]);

      const minutes = this.expressions[1];
      const nextMinute = availableValue(minutes, dateParts.minute);
      if(nextMinute){
        date.set('minute', nextMinute);
        if(this.matchIgnoringWeekday(date)){
          return date;
        }
      }
      date.set('minute',minutes[0]);

      const hours = this.expressions[2];
      const nextHour = availableValue(hours, dateParts.hour);
      if(nextHour){
        date.set('hour', nextHour);
        if(this.matchIgnoringWeekday(date)){
          return date;
        }
      }
      date.set('hour', hours[0]);

      const days = this.expressions[3];
      const nextDay = availableValue(days, dateParts.day);
      if(nextDay){
        date.set('day', nextDay);
        if(this.matchIgnoringWeekday(date)){
          return date;
        }
      }
      
      date.set('day', days[0]);

      const months = this.expressions[4];
      const nextMonth = availableValue(months, dateParts.month);
      
      if(nextMonth){
        date.set('month', nextMonth);
        if(this.matchIgnoringWeekday(date)){
          return date;
        }
      }

      date.set('year', date.getParts().year + 1);
      date.set('month', months[0]);

      return date;
    }

    const date = findNextDateIgnoringWeekday();
    const weekdays = this.expressions[5];
    const days = this.expressions[3];
    
    // Check if day-of-month is wildcard (contains all possible days 1-31)
    const isDayWildcard = days.length >= 31 && days.includes(1) && days.includes(31);
    
    if (isDayWildcard) {
      // When day is wildcard, use OR logic: find next occurrence of weekday OR month
      // Since we already found the right month, just find the next weekday in that month
      let currentWeekday = parseInt(weekDayNamesConversion(date.getParts().weekday));
      
      while(!(weekdays.indexOf(currentWeekday) > -1)){
        date.set('day', date.getParts().day + 1); 
        currentWeekday = parseInt(weekDayNamesConversion(date.getParts().weekday));
      }
    } else {
      // When day is specific, use AND logic: must match exact day AND weekday
      // Keep searching until we find a date where the specified day falls on the specified weekday
      const maxAttempts = 10 * 12; // 10 years * 12 months
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        const currentWeekday = parseInt(weekDayNamesConversion(date.getParts().weekday));
        
        if (weekdays.indexOf(currentWeekday) > -1) {
          // Found matching weekday for the specified day
          break;
        }
        
        // Move to next occurrence of the same day in the same month (next year if necessary)
        const currentParts = date.getParts();
        const nextMonth = availableValue(this.expressions[4], currentParts.month);
        
        if (nextMonth) {
          date.set('month', nextMonth);
        } else {
          // Move to next year and reset to first allowed month
          date.set('year', currentParts.year + 1);
          date.set('month', this.expressions[4][0]);
        }
        
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Could not find next matching date within reasonable time range');
      }
    }
    
    return date;
  }
}

function availableValue(values: number[], currentValue: number) : number | false {
  const availableValues = values.sort((a,b) => a - b).filter(s => s > currentValue);
  if(availableValues.length > 0) return availableValues[0];
  return false;
}