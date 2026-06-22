/**
 * The `L` token in the day-of-month field means "the last day of the month",
 * which is 28, 29, 30 or 31 depending on the month and year. It is kept as a
 * literal token (rather than a fixed number) through the pattern pipeline and
 * resolved against the actual date here.
 */
export const LAST_DAY_TOKEN = 'L';

/**
 * The `W` modifier in the day-of-month field means "the nearest weekday
 * (Monday-Friday) to the given day, without crossing the month boundary".
 * It suffixes either a day number (`15W`) or the `L` token (`LW`, the last
 * weekday of the month). Like `L`, it is kept as a literal token through the
 * pipeline and resolved against the actual date here. Weekends are the only
 * adjustment; there is no holiday awareness.
 */
const WEEKDAY_TOKEN = /^(\d{1,2}|L)W$/;

/**
 * The `L-n` form in the day-of-month field means "the day `n` days before the
 * last day of the month" (e.g. `L-3` is the third-to-last day). Kept as a
 * literal token and resolved here. When the offset reaches past the start of a
 * particular month (e.g. `L-29` in February) no day matches that month.
 */
const LAST_DAY_OFFSET_TOKEN = /^L-(\d{1,2})$/;

export type DayOfMonthField = (number | string)[];

/** The last calendar day (28-31) of the given 1-based month. */
export function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The nearest weekday (Mon-Fri) to `target` within the given 1-based month,
 * never crossing into an adjacent month:
 *  - a weekday target resolves to itself;
 *  - a Saturday shifts to the previous Friday, unless that would leave the
 *    month (target is the 1st), in which case it shifts to the following Monday;
 *  - a Sunday shifts to the following Monday, unless that would leave the month
 *    (target is the last day), in which case it shifts to the previous Friday.
 * Returns -1 when `target` does not exist in the month (e.g. 31W in April).
 */
function nearestWeekday(year: number, month: number, target: number): number {
  const last = lastDayOfMonth(year, month);
  if (target < 1 || target > last) return -1;
  const weekday = new Date(Date.UTC(year, month - 1, target)).getUTCDay(); // 0=Sun..6=Sat
  if (weekday === 6) return target === 1 ? target + 2 : target - 1; // Saturday
  if (weekday === 0) return target === last ? target - 2 : target + 1; // Sunday
  return target;
}

/**
 * Whether the day-of-month field matches the given date, honouring the `L`
 * (last day of month) and `nW` / `LW` (nearest weekday) tokens alongside any
 * explicit numeric days.
 */
export function matchesDayOfMonth(
  field: DayOfMonthField,
  year: number,
  month: number,
  day: number,
): boolean {
  for (const value of field) {
    if (value === day) return true;
    if (value === LAST_DAY_TOKEN && day === lastDayOfMonth(year, month)) return true;
    if (typeof value === 'string') {
      const weekdayMatch = WEEKDAY_TOKEN.exec(value);
      if (weekdayMatch) {
        const target = weekdayMatch[1] === LAST_DAY_TOKEN ? lastDayOfMonth(year, month) : parseInt(weekdayMatch[1], 10);
        if (nearestWeekday(year, month, target) === day) return true;
      }
      const offsetMatch = LAST_DAY_OFFSET_TOKEN.exec(value);
      if (offsetMatch) {
        const target = lastDayOfMonth(year, month) - parseInt(offsetMatch[1], 10);
        if (target >= 1 && target === day) return true;
      }
    }
  }
  return false;
}
