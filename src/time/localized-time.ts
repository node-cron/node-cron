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
    this.parts = buidDateParts(date, timezone);
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
    const newDate = new Date(this.toISO());
    this.timestamp = newDate.getTime();
    this.parts = buidDateParts(newDate, this.timezone)
  }
}

function buidDateParts(date: Date, timezone?: string): DateParts {
  const dftOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false,
    timeZoneName: 'longOffset'
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
    hour: parseInt(parts.hour),
    minute: parseInt(parts.minute),
    second: parseInt(parts.second),
    milisecond: date.getMilliseconds(),
    weekday: parts.weekday,
    gmt: parts.timeZoneName
  }
}