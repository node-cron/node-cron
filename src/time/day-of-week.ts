/**
 * Extended day-of-week tokens, resolved against the actual date.
 *
 * `<weekday>L` means "the last <weekday> of the month": `5L` is the last Friday,
 * `0L`/`7L` the last Sunday.
 *
 * `<weekday>#<nth>` selects the nth occurrence of a weekday in the month: `2#3`
 * means "the 3rd Tuesday of the month".
 *
 * Weekday numbering follows the cron convention (0 = Sunday, after 7 has been
 * normalised to 0). Like the day-of-month `L` token, these entries are kept as
 * literal strings through the pattern pipeline and resolved here.
 */

/** Matches a `<weekday>L` token, e.g. `5L`, `0L`, `7L`. */
const LAST_WEEKDAY_REGEX = /^([0-7])L$/i;
/** Matches a `<weekday>#<nth>` token, e.g. `2#3`. */
const NTH_WEEKDAY_REGEX = /^([0-7])#([1-5])$/;

export type DayOfWeekField = (number | string)[];

export interface NthWeekday {
  /** The weekday, 0-6 (Sunday = 0). */
  weekday: number;
  /** Which occurrence in the month, 1-5. */
  nth: number;
}

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

/** Whether the given field entry is an `<weekday>#<nth>` token. */
export function isNthWeekdayToken(value: number | string): value is string {
  return typeof value === 'string' && NTH_WEEKDAY_REGEX.test(value);
}

/**
 * Parses an `<weekday>#<nth>` token into its parts, normalising weekday 7 to 0
 * (both mean Sunday). Returns null when the value is not such a token.
 */
export function parseNthWeekday(value: number | string): NthWeekday | null {
  if (typeof value !== 'string') return null;
  const match = NTH_WEEKDAY_REGEX.exec(value);
  if (!match) return null;
  const weekday = parseInt(match[1], 10) % 7; // 7 -> 0 (Sunday)
  const nth = parseInt(match[2], 10);
  return { weekday, nth };
}

/**
 * Which occurrence (1-based) of its weekday the given day is within its month.
 * The 1st, 8th, 15th, 22nd and 29th of a month are the 1st..5th occurrence of
 * whatever weekday they fall on.
 */
export function occurrenceInMonth(day: number): number {
  return Math.floor((day - 1) / 7) + 1;
}

/**
 * Whether a date matches an `<weekday>#<nth>` token: it must both fall on the
 * requested weekday and be the nth such weekday in its month. A month with only
 * four occurrences of a weekday never matches `#5`.
 */
export function matchesNthWeekday(
  token: string,
  year: number,
  month: number,
  day: number,
): boolean {
  const parsed = parseNthWeekday(token);
  if (!parsed) return false;
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  if (weekday !== parsed.weekday) return false;
  return occurrenceInMonth(day) === parsed.nth;
}

/**
 * Whether the day-of-week field matches the given date. Plain numeric entries
 * match on weekday alone; `<weekday>L` requires the date to be the last such
 * weekday in its month; `<weekday>#<nth>` requires it to be the nth such weekday
 * in its month. `weekday` is the date's 0-6 weekday (Sunday=0).
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
    if (isNthWeekdayToken(value)) {
      if (matchesNthWeekday(value, year, month, day)) return true;
      continue;
    }
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
