/**
 * The `#` token in the day-of-week field selects the nth occurrence of a given
 * weekday within the month. For example `2#3` means "the 3rd Tuesday of the
 * month" (weekday numbering follows the cron convention where 0 = Sunday).
 *
 * Like the day-of-month `L` token, an `<weekday>#<n>` entry is kept as a literal
 * string token (rather than a plain number) through the pattern pipeline and is
 * resolved against the actual date here.
 */

/** Matches a `<weekday>#<nth>` token, e.g. `2#3`. */
const NTH_WEEKDAY_REGEX = /^([0-7])#([1-5])$/;

export type DayOfWeekField = (number | string)[];

export interface NthWeekday {
  /** The weekday, 0-6 (Sunday = 0). */
  weekday: number;
  /** Which occurrence in the month, 1-5. */
  nth: number;
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
 * match on weekday alone; `<weekday>#<nth>` tokens additionally require the date
 * to be the nth occurrence of that weekday in its month.
 */
export function matchesDayOfWeek(
  field: DayOfWeekField,
  year: number,
  month: number,
  day: number,
  weekday: number,
): boolean {
  for (const entry of field) {
    if (isNthWeekdayToken(entry)) {
      if (matchesNthWeekday(entry, year, month, day)) return true;
    } else if (entry === weekday) {
      return true;
    }
  }
  return false;
}
