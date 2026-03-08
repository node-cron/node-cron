type DateParts = {
  day: number
  month: number
  year: number
  hour: number
  minute: number
  second: number
  milisecond: number
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

  set(field: string, value: number){
    this.parts[field] = value;
    const isoString = this.toISO();
    const newDate = new Date(isoString);
    this.timestamp = newDate.getTime();

    // Rebuild parts from the new timestamp
    this.parts = buildDateParts(newDate, this.timezone);

    // If the offset changed (DST boundary crossing), the local time fields
    // may have drifted. Detect this and correct by adjusting the timestamp
    // to preserve the intended local time.
    const oldGmt = parseOffsetMinutes(isoString);
    const newGmt = parseOffsetMinutes(this.toISO());
    if (oldGmt !== null && newGmt !== null && oldGmt !== newGmt) {
      const driftMs = (newGmt - oldGmt) * 60000;
      this.timestamp -= driftMs;
      this.parts = buildDateParts(new Date(this.timestamp), this.timezone);
    }
  }
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
  const hours = match[2].padStart(2, '0');
  const minutes = (match[3] || '00').padStart(2, '0');

  return `GMT${sign}${hours}:${minutes}`;
}