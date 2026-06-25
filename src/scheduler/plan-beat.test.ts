import { planBeat } from './plan-beat';
import { TimeMatcher } from '../time/time-matcher';

// A heartbeat timer is armed to fire at `expected`. Because long setTimeout
// delays are imprecise (OS sleep, GC, throttling, clock drift) the callback can
// land late. planBeat decides, given the slot we armed for (`expected`), when
// the beat actually woke (`now`) and the configured tolerance, whether to run
// the slot, report it as missed, or keep waiting. The tolerance is always
// bounded by the gap to the next slot so a late run can never bleed into it.

const SECOND = 1000;
const MINUTE = 60 * SECOND;

// 6-field crons pinned to UTC so the expectations hold on any machine.
const daily = new TimeMatcher('0 0 9 * * *', 'Etc/UTC');    // 09:00:00 every day
const hourly = new TimeMatcher('0 0 * * * *', 'Etc/UTC');   // HH:00:00 every hour
const everySecond = new TimeMatcher('* * * * * *', 'Etc/UTC');

const nextMatchOf = (matcher: TimeMatcher) => (d: Date) => matcher.getNextMatch(d);
const at = (iso: string) => new Date(iso);
const times = (dates: Date[]) => dates.map(d => d.toISOString());

describe('scheduler/plan-beat', function(){
  it('runs the slot when the beat is exactly on time', function(){
    const plan = planBeat(at('2026-06-16T09:00:00Z'), at('2026-06-16T09:00:00Z'), SECOND, nextMatchOf(daily));
    expect(plan.run?.toISOString()).toBe('2026-06-16T09:00:00.000Z');
    expect(times(plan.missed)).toEqual([]);
    expect(plan.next.toISOString()).toBe('2026-06-17T09:00:00.000Z');
  });

  it('runs the slot when the beat is late but within tolerance', function(){
    const plan = planBeat(at('2026-06-16T09:00:00Z'), at('2026-06-16T09:00:01.500Z'), 2 * SECOND, nextMatchOf(daily));
    expect(plan.run?.toISOString()).toBe('2026-06-16T09:00:00.000Z');
    expect(times(plan.missed)).toEqual([]);
    expect(plan.next.toISOString()).toBe('2026-06-17T09:00:00.000Z');
  });

  it('reports the slot as missed (and does not run it) when the beat is late beyond tolerance', function(){
    const plan = planBeat(at('2026-06-16T09:00:00Z'), at('2026-06-16T09:00:03Z'), SECOND, nextMatchOf(daily));
    expect(plan.run).toBeUndefined();
    expect(times(plan.missed)).toEqual(['2026-06-16T09:00:00.000Z']);
    expect(plan.next.toISOString()).toBe('2026-06-17T09:00:00.000Z');
  });

  it('waits without running when the beat fires early (clock moved back)', function(){
    const plan = planBeat(at('2026-06-16T09:00:00Z'), at('2026-06-16T08:59:59Z'), SECOND, nextMatchOf(daily));
    expect(plan.run).toBeUndefined();
    expect(times(plan.missed)).toEqual([]);
    expect(plan.next.toISOString()).toBe('2026-06-16T09:00:00.000Z');
  });

  it('caps the tolerance to the interval so a 1s cron never double-fires a slot', function(){
    // Tolerance dwarfs the 1s gap. On time -> run this slot, expect the very
    // next second, never re-run the same slot.
    const plan = planBeat(at('2026-06-16T09:00:05Z'), at('2026-06-16T09:00:05Z'), 5 * SECOND, nextMatchOf(everySecond));
    expect(plan.run?.toISOString()).toBe('2026-06-16T09:00:05.000Z');
    expect(times(plan.missed)).toEqual([]);
    expect(plan.next.toISOString()).toBe('2026-06-16T09:00:06.000Z');
  });

  it('on a 1s cron with a large tolerance, a 1.5s-late beat misses the old slot and runs the current one', function(){
    const plan = planBeat(at('2026-06-16T09:00:05Z'), at('2026-06-16T09:00:06.500Z'), 5 * SECOND, nextMatchOf(everySecond));
    expect(plan.run?.toISOString()).toBe('2026-06-16T09:00:06.000Z');
    expect(times(plan.missed)).toEqual(['2026-06-16T09:00:05.000Z']);
    expect(plan.next.toISOString()).toBe('2026-06-16T09:00:07.000Z');
  });

  it('recovers an hourly slot that woke 40min late (tolerance 1.5h, capped to 1h)', function(){
    const plan = planBeat(at('2026-06-16T10:00:00Z'), at('2026-06-16T10:40:00Z'), 90 * MINUTE, nextMatchOf(hourly));
    expect(plan.run?.toISOString()).toBe('2026-06-16T10:00:00.000Z');
    expect(times(plan.missed)).toEqual([]);
    expect(plan.next.toISOString()).toBe('2026-06-16T11:00:00.000Z');
  });

  it('treats an hourly slot as missed once the next slot has arrived, then runs the next', function(){
    const plan = planBeat(at('2026-06-16T10:00:00Z'), at('2026-06-16T11:00:01Z'), 90 * MINUTE, nextMatchOf(hourly));
    expect(plan.run?.toISOString()).toBe('2026-06-16T11:00:00.000Z');
    expect(times(plan.missed)).toEqual(['2026-06-16T10:00:00.000Z']);
    expect(plan.next.toISOString()).toBe('2026-06-16T12:00:00.000Z');
  });

  it('after a long block reports every superseded slot missed and runs only the most recent', function(){
    // Blocked 2.5h on an hourly cron: 10:00 and 11:00 are gone, 12:00 still runnable.
    const plan = planBeat(at('2026-06-16T10:00:00Z'), at('2026-06-16T12:30:00Z'), 90 * MINUTE, nextMatchOf(hourly));
    expect(plan.run?.toISOString()).toBe('2026-06-16T12:00:00.000Z');
    expect(times(plan.missed)).toEqual(['2026-06-16T10:00:00.000Z', '2026-06-16T11:00:00.000Z']);
    expect(plan.next.toISOString()).toBe('2026-06-16T13:00:00.000Z');
  });

  it('reports the slot missed but keeps waiting for the future next slot (late beyond tolerance, next not yet due)', function(){
    // Hourly, woke 30s late with a 1s tolerance: 10:00 is missed, but 11:00 is
    // still in the future so nothing runs and we wait for it.
    const plan = planBeat(at('2026-06-16T10:00:00Z'), at('2026-06-16T10:00:30Z'), SECOND, nextMatchOf(hourly));
    expect(plan.run).toBeUndefined();
    expect(times(plan.missed)).toEqual(['2026-06-16T10:00:00.000Z']);
    expect(plan.next.toISOString()).toBe('2026-06-16T11:00:00.000Z');
  });
});
