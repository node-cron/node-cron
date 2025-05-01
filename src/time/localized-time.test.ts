import { assert } from 'chai';
import { LocalizedTime } from './localized-time';

describe('LocalizedTime', function(){
  it('converts to a timezone', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "Europe/Istanbul");
    assert.equal(localTime.toISO(), '2025-04-30T12:08:05.078+03:00');
  });

  it('converts to a timezone outside of DST', function(){
    const date = new Date(Date.UTC(2025, 0, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "America/Detroit");
    assert.equal(localTime.toISO(), '2025-01-30T04:08:05.078-05:00');
  });

  it('converts to a timezone within DST', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "America/Detroit");
    assert.equal(localTime.toISO(), '2025-04-30T05:08:05.078-04:00');
  });

  it('works withou timezone', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date);
    assert.isDefined(localTime.getParts().gmt)
  });

  it('converts to date', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "Europe/Istanbul");
    assert.equal(localTime.toDate().getTime(), new Date('2025-04-30T09:08:05.078Z').getTime())
  });

  it('returns the data parts', function(){
    const date = new Date(Date.UTC(2025, 3, 30, 9, 8, 5, 78));
    const localTime = new LocalizedTime(date, "Europe/Istanbul");
    assert.deepEqual(localTime.getParts(), { 
      day: 30, 
      month: 4, 
      year: 2025, 
      hour: 12, 
      minute: 8, 
      second: 5, 
      milisecond: 78, 
      weekday: 'Wed', 
      gmt: 'GMT+03:00' 
    });
  });
})