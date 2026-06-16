/**
 * The `L` token in the day-of-month field means "the last day of the month",
 * which is 28, 29, 30 or 31 depending on the month and year. It is kept as a
 * literal token (rather than a fixed number) through the pattern pipeline and
 * resolved against the actual date here.
 */
export const LAST_DAY_TOKEN = 'L';

export type DayOfMonthField = (number | string)[];

/** The last calendar day (28-31) of the given 1-based month. */
export function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Whether the day-of-month field matches the given date, honouring the `L`
 * (last day of month) token alongside any explicit numeric days.
 */
export function matchesDayOfMonth(
  field: DayOfMonthField,
  year: number,
  month: number,
  day: number,
): boolean {
  if (field.includes(day)) return true;
  if (field.includes(LAST_DAY_TOKEN) && day === lastDayOfMonth(year, month)) return true;
  return false;
}
