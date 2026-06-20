/**
 * The `L` token in the day-of-week field means "the last <weekday> of the
 * month": `5L` is the last Friday, `0L`/`7L` the last Sunday. Weekday numbering
 * follows the existing convention (0 = Sunday, after 7 has been normalised to
 * 0). The token is kept as a literal `<weekday>L` string through the pattern
 * pipeline and resolved against the actual date here.
 */
const LAST_WEEKDAY_REGEX = /^([0-7])L$/i;

export type DayOfWeekField = (number | string)[];

/**
 * Parses a `<weekday>L` token into its 0-6 weekday number (Sunday=0), or
 * returns null when the value is not such a token. `7L` is treated as `0L`.
 */
export function parseLastWeekdayToken(value: number | string): number | null {
  if (typeof value !== 'string') return null;
  const match = LAST_WEEKDAY_REGEX.exec(value);
  if (!match) return null;
  const weekday = parseInt(match[1], 10);
  return weekday === 7 ? 0 : weekday;
}

/** Whether `value` is a `<weekday>L` token (e.g. `5L`, `0L`, `7L`). */
export function isLastWeekdayToken(value: number | string): boolean {
  return parseLastWeekdayToken(value) !== null;
}

/**
 * Whether the given date is the last occurrence of its weekday in its month.
 * A weekday is the last of the month when adding 7 days moves into the next
 * month.
 */
export function isLastWeekdayOfMonth(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  const inSevenDays = new Date(date.getTime());
  inSevenDays.setUTCDate(inSevenDays.getUTCDate() + 7);
  return inSevenDays.getUTCMonth() + 1 !== month;
}

/**
 * Whether the day-of-week field matches the given date, honouring the
 * `<weekday>L` (last weekday of month) token alongside any explicit numeric
 * weekdays. `weekday` is the date's 0-6 weekday (Sunday=0).
 */
export function matchesDayOfWeek(
  field: DayOfWeekField,
  year: number,
  month: number,
  day: number,
  weekday: number,
): boolean {
  for (const value of field) {
    if (value === weekday) return true;
    const lastWeekday = parseLastWeekdayToken(value);
    if (
      lastWeekday !== null &&
      lastWeekday === weekday &&
      isLastWeekdayOfMonth(year, month, day)
    ) {
      return true;
    }
  }
  return false;
}
