import { LocalizedTime, localTimeToTimestamp } from './localized-time';

describe('LocalizedTime', function(){
  it('converts to a timezone', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "Europe/Istanbul");
    expect(localTime.toISO()).toBe('2025-04-30T12:08:05.078+03:00');
  });

  it('converts to a timezone outside of DST', function(){
    const date = new Date(Date.UTC(2025, 0, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "America/Detroit");
    expect(localTime.toISO()).toBe('2025-01-30T04:08:05.078-05:00');
  });

  it('converts to a timezone within DST', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "America/Detroit");
    expect(localTime.toISO()).toBe('2025-04-30T05:08:05.078-04:00');
  });

  it('works withou timezone', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date);
    expect(localTime.getParts().gmt).toBeDefined();
  });

  it('converts to date', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "Europe/Istanbul");
    expect(localTime.toDate().getTime()).toBe(new Date('2025-04-30T09:08:05.078Z').getTime());
  });

  it('returns the data parts', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "Europe/Istanbul");
    expect(localTime.getParts()).toEqual({
      day: 30,
      month: 4,
      year: 2025,
      hour: 12,
      minute: 8,
      second: 5,
      millisecond: 78,
      weekday: 'Wed',
      gmt: 'GMT+03:00'
    });
  });
})

describe('LocalizedTime with UTC', function(){
  it('formats ISO with Z offset for Etc/UTC timezone', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, 'Etc/UTC');
    expect(localTime.toISO()).toBe('2025-04-30T09:08:05.078Z');
  });

  it('resolves UTC offset via localTimeToTimestamp', function(){
    const ts = localTimeToTimestamp(
      { year: 2026, month: 6, day: 15, hour: 12, minute: 0, second: 0, millisecond: 0 },
      'Etc/UTC'
    );
    expect(new Date(ts).toISOString()).toBe('2026-06-15T12:00:00.000Z');
  });
});

describe('localTimeToTimestamp', function(){
  it('resolves a wall-clock outside any DST transition', function(){
    const ts = localTimeToTimestamp(
      { year: 2026, month: 1, day: 15, hour: 10, minute: 30, second: 0, millisecond: 0 },
      'America/New_York'
    );
    expect(new Date(ts).toISOString()).toBe('2026-01-15T15:30:00.000Z');
  });

  it('resolves a non-existent spring-forward wall-clock forward', function(){
    // 2026-03-08 02:30 does not exist in America/New_York (clocks jump 02:00 -> 03:00).
    const ts = localTimeToTimestamp(
      { year: 2026, month: 3, day: 8, hour: 2, minute: 30, second: 0, millisecond: 0 },
      'America/New_York'
    );
    expect(new Date(ts).toISOString()).toBe('2026-03-08T07:30:00.000Z');
  });

  it('resolves an ambiguous fall-back wall-clock to the first occurrence', function(){
    // 2026-11-01 01:30 happens twice in America/New_York (clocks fall back 02:00 -> 01:00).
    const ts = localTimeToTimestamp(
      { year: 2026, month: 11, day: 1, hour: 1, minute: 30, second: 0, millisecond: 0 },
      'America/New_York'
    );
    expect(new Date(ts).toISOString()).toBe('2026-11-01T05:30:00.000Z');
  });
})

describe('localTimeToTimestamp fall-back disambiguation', function () {

  it('supports the earliest representable UTC date', function () {
    const timestamp = localTimeToTimestamp({
      year: -271821, month: 4, day: 20,
      hour: 0, minute: 0, second: 0, millisecond: 0,
    }, 'UTC');
    expect(timestamp).toBe(-8640000000000000);
  });


  it.each([
    ['Europe/London', '2025-10-26T01:30:00.000', '2025-10-26T00:30:00.000Z'],
    ['Europe/Berlin', '2025-10-26T02:30:00.000', '2025-10-26T00:30:00.000Z'],
    ['Europe/Helsinki', '2025-10-26T03:30:00.000', '2025-10-26T00:30:00.000Z'],
    ['Australia/Sydney', '2026-04-05T02:30:00.000', '2026-04-04T15:30:00.000Z'],
    ['Pacific/Auckland', '2026-04-05T02:30:00.000', '2026-04-04T13:30:00.000Z'],
    ['Australia/Lord_Howe', '2025-04-06T01:45:00.000', '2025-04-05T14:45:00.000Z'],
    ['Pacific/Chatham', '2025-04-06T03:00:00.000', '2025-04-05T13:15:00.000Z'],
    ['Europe/London', '2025-10-26T01:00:00.000', '2025-10-26T00:00:00.000Z'],
    ['Europe/London', '2025-10-26T01:59:59.999', '2025-10-26T00:59:59.999Z'],
    ['Europe/London', '2025-10-26T02:00:00.000', '2025-10-26T02:00:00.000Z'],
    ['Europe/London', '2025-03-30T01:30:00.000', '2025-03-30T01:30:00.000Z'],
  ])('resolves %s %s to %s', function (timezone, wallClock, expected) {
    const date = new Date(wallClock + 'Z');
    const timestamp = localTimeToTimestamp({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds(),
      millisecond: date.getUTCMilliseconds(),
    }, timezone);
    expect(new Date(timestamp).toISOString()).toBe(expected);
  });
});
