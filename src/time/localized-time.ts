export type WallClock = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  milisecond: number
}

type DateParts = WallClock & {
  weekday: string
  gmt: string
}

export class LocalizedTime {
  timestamp: number
  parts: DateParts
  timezone?: string | undefined

  constructor(date: Date, timezone?: string){
    this.timestamp = date.getTime();
    this.timezone = timezone;
    this.parts = buildDateParts(date, timezone);
  }

  toDate(): Date{
    return new Date(this.timestamp);
  }

  toISO(): string{
    const gmt = this.parts.gmt.replace(/^GMT/, '');
    const offset = gmt ? gmt : 'Z';

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${this.parts.year}-${pad(this.parts.month)}-${pad(this.parts.day)}`
         + `T${pad(this.parts.hour)}:${pad(this.parts.minute)}:${pad(this.parts.second)}`
         + `.${String(this.parts.milisecond).padStart(3, '0')}`
         + offset;
  }

  getParts(): DateParts {
    return this.parts;
  }
}

/**
 * Returns the timezone offset, in minutes, for the given instant
 * (local - UTC). e.g. New York in winter (EST) returns -300.
 */
function getOffsetMinutes(date: Date, timezone?: string): number {
  const offset = parseOffsetMinutes(getTimezoneGMT(date, timezone).replace(/^GMT/, '') || 'Z');
  return offset ?? 0;
}

/**
 * Returns true if the given instant, read back in the timezone, matches the
 * requested local wall-clock down to the second.
 */
function readsBackTo(timestamp: number, parts: WallClock, timezone?: string): boolean {
  const p = buildDateParts(new Date(timestamp), timezone);
  return p.year === parts.year && p.month === parts.month && p.day === parts.day
      && p.hour === parts.hour && p.minute === parts.minute && p.second === parts.second;
}

/**
 * Converts a set of local wall-clock fields to the absolute timestamp that
 * reads back as those fields in the given timezone.
 *
 * It guesses the instant by treating the wall-clock as if it were UTC, then
 * corrects with the offset actually in effect. Away from DST transitions the
 * first correction is exact. Near a transition both the pre- and post-shift
 * offsets are considered and the one that genuinely reads back to the
 * requested wall-clock wins. For a non-existent local time (the spring-forward
 * gap) neither reads back, so we resolve forward to the later instant instead
 * of drifting backwards into the gap (which used to yield a past date).
 */
export function localTimeToTimestamp(parts: WallClock, timezone?: string): number {
  const guess = Date.UTC(
    parts.year, parts.month - 1, parts.day,
    parts.hour, parts.minute, parts.second, parts.milisecond
  );

  const firstOffset = getOffsetMinutes(new Date(guess), timezone);
  const candidate1 = guess - firstOffset * 60000;

  const secondOffset = getOffsetMinutes(new Date(candidate1), timezone);
  if (secondOffset === firstOffset) {
    return candidate1;
  }

  const candidate2 = guess - secondOffset * 60000;
  if (readsBackTo(candidate1, parts, timezone)) return candidate1;
  if (readsBackTo(candidate2, parts, timezone)) return candidate2;

  // Non-existent local time (spring-forward gap): resolve forward.
  return Math.max(candidate1, candidate2);
}

function buildDateParts(date: Date, timezone?: string): DateParts {
  const dftOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false
  }

  if(timezone){
    dftOptions.timeZone = timezone;
  }

  const dateFormat = new Intl.DateTimeFormat('en-US', dftOptions);
  const parts = dateFormat.formatToParts(date).filter(part => {
    return part.type !== 'literal';
  }).reduce((acc:any, part) => {
      acc[part.type] = part.value;
      return acc;
  }, {});

  return {
    day: parseInt(parts.day),
    month: parseInt(parts.month),
    year: parseInt(parts.year),
    hour: parts.hour === '24' ? 0 : parseInt(parts.hour),
    minute: parseInt(parts.minute),
    second: parseInt(parts.second),
    milisecond: date.getMilliseconds(),
    weekday: parts.weekday,
    gmt: getTimezoneGMT(date, timezone)
  }
}


function parseOffsetMinutes(isoString: string): number | null {
  if (isoString.endsWith('Z')) return 0;
  const match = isoString.match(/([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const sign = match[1] === '+' ? 1 : -1;
  return sign * (parseInt(match[2]) * 60 + parseInt(match[3]));
}

function getTimezoneGMT(date: Date, timezone?: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset'
  });
  const parts = fmt.formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  if (!tzPart) return 'Z';

  const tzValue = tzPart.value; // e.g. "GMT-5", "GMT+5:30", "GMT"
  if (tzValue === 'GMT') return 'Z';

  // Parse the offset from the Intl-provided string
  const match = tzValue.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 'Z';

  const sign = match[1];
  const hoursNum = parseInt(match[2]);
  const minutesNum = parseInt(match[3] || '0');
  if (hoursNum === 0 && minutesNum === 0) return 'Z';

  const hours = match[2].padStart(2, '0');
  const minutes = (match[3] || '00').padStart(2, '0');

  return `GMT${sign}${hours}:${minutes}`;
}