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
