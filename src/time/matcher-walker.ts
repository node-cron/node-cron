import convertExpression from '../pattern/convertion';
import { LocalizedTime, localTimeToTimestamp } from './localized-time';
import { TimeMatcher } from './time-matcher';
import { matchesDayOfMonth, DayOfMonthField } from './day-of-month';

// Upper bound on the calendar search before giving up. A century is far beyond
// any real recurrence (the calendar repeats within 28 years) and the loop is
// cheap, so reaching it means the expression can never match (e.g. `0 0 31 2 *`).
const MAX_DAYS = 366 * 100;

export class MatcherWalker {
  cronExpression: string;
  baseDate: Date;
  timeMatcher: TimeMatcher;
  timezone?: string;

  // Time fields are sorted so they can be iterated in ascending order; day and
  // month are only membership-tested, so their order does not matter.
  private readonly seconds: number[];
  private readonly minutes: number[];
  private readonly hours: number[];
  private readonly days: DayOfMonthField;
  private readonly months: number[];
  private readonly weekdays: number[];

  constructor(cronExpression: string, baseDate: Date, timezone?: string) {
    this.cronExpression = cronExpression;
    this.baseDate = baseDate;
    this.timeMatcher = new TimeMatcher(cronExpression, timezone);
    this.timezone = timezone;

    const expressions = convertExpression(cronExpression);
    this.seconds = sortedAsc(expressions[0]);
    this.minutes = sortedAsc(expressions[1]);
    this.hours = sortedAsc(expressions[2]);
    this.days = expressions[3];
    this.months = expressions[4];
    this.weekdays = expressions[5];
  }

  isMatching() {
    return this.timeMatcher.match(this.baseDate);
  }

  /**
   * Finds the next instant that satisfies the expression, strictly after the
   * base date.
   *
   * Instead of scanning time tick by tick, it infers candidates directly from
   * the cron fields: it walks the calendar day by day (a Y/M/D is the same
   * weekday in every timezone), and on each day that satisfies month and
   * day-of-month it tries the matching times in ascending order. Each candidate
   * is materialized to a real instant in the timezone and confirmed with the
   * real matcher, which both enforces the weekday constraint and rejects
   * non-existent local times (the DST spring-forward gap) by construction.
   */
  matchNext(): LocalizedTime {
    const months = this.months;
    const days = this.days;

    const baseMs = Math.floor(this.baseDate.getTime() / 1000) * 1000;
    const baseParts = new LocalizedTime(new Date(baseMs), this.timezone).getParts();

    let { year, month, day } = baseParts;

    for (let i = 0; i < MAX_DAYS; i++) {
      // Pre-check month, day-of-month and weekday before the (potentially
      // 86,400-wide) time-of-day scan. The weekday check mirrors match()
      // exactly, so it only skips days that would be rejected anyway, and it
      // avoids scanning every time on a day whose weekday can't match (e.g.
      // `* * * 15 * 1`, the 15th only when it is a Monday).
      if (months.includes(month) && matchesDayOfMonth(days, year, month, day) && this.matchesWeekday(year, month, day)) {
        // On the base day the result must be strictly after the base instant;
        // on later days any matching time of day qualifies.
        const lowerBound = i === 0 ? baseParts : null;
        const found = this.firstTimeOnDay(year, month, day, lowerBound, baseMs);
        if (found !== null) {
          return new LocalizedTime(new Date(found), this.timezone);
        }
      }

      ({ year, month, day } = nextDay(year, month, day));
    }

    throw new Error('Could not find next matching date within reasonable time range');
  }

  /**
   * Smallest matching (hour, minute, second) on the given calendar day that
   * materializes to a real instant strictly after the base. Returns the
   * timestamp, or null when no matching time of day qualifies (for example the
   * only matching wall-clock time falls in a DST spring-forward gap, or every
   * match on the base day is at or before the base instant).
   */
  private firstTimeOnDay(
    year: number,
    month: number,
    day: number,
    lowerBound: { hour: number; minute: number; second: number } | null,
    baseMs: number,
  ): number | null {
    const { seconds, minutes, hours } = this;

    for (const hour of hours) {
      // On the base day, whole earlier hours can be skipped cheaply.
      if (lowerBound && hour < lowerBound.hour) continue;
      for (const minute of minutes) {
        for (const second of seconds) {
          // Skip times of day at or before the base instant on the base day.
          if (lowerBound && !isLaterInDay(hour, minute, second, lowerBound)) continue;

          const ts = localTimeToTimestamp(
            { year, month, day, hour, minute, second, milisecond: 0 },
            this.timezone,
          );

          // The real matcher confirms every field on the actual instant. A
          // wall-clock time that does not exist (DST gap) materializes to a
          // different instant whose hour will not match, so it is rejected here.
          if (ts > baseMs && this.timeMatcher.match(new Date(ts))) {
            return ts;
          }
        }
      }
    }

    return null;
  }

  /**
   * Whether the calendar day matches the weekday field. A given Y/M/D has the
   * same weekday in every timezone, so it is computed arithmetically.
   * `getUTCDay()` and the converted weekday field share the same 0-6 (Sunday=0)
   * space, so this matches what match() computes, making it a safe pre-filter.
   */
  private matchesWeekday(year: number, month: number, day: number): boolean {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return this.weekdays.indexOf(weekday) !== -1;
  }
}

function nextDay(year: number, month: number, day: number): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day + 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function sortedAsc(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

// True when (hour, minute, second) is strictly later in the day than the bound.
function isLaterInDay(
  hour: number,
  minute: number,
  second: number,
  bound: { hour: number; minute: number; second: number },
): boolean {
  return hour * 3600 + minute * 60 + second > bound.hour * 3600 + bound.minute * 60 + bound.second;
}
