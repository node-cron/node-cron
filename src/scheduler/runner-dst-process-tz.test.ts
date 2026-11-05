import { Runner } from './runner';
import { TimeMatcher } from '../time/time-matcher';

// The task timezone is Etc/UTC, but the *process* timezone (process.env.TZ /
// /etc/localtime) observes DST. Run this file with e.g.
//   TZ=Europe/Vilnius npx vitest run src/scheduler/runner-dst-process-tz.test.ts
// Europe falls back on 2026-10-25 at 01:00Z: local 04:00 EEST -> 03:00 EET, so
// the local hour 03:00-04:00 happens twice (00:00Z-01:00Z and 01:00Z-02:00Z).
// It also passes with TZ=UTC, where the process zone has no DST.
describe('scheduler/runner across a DST fall-back of the process timezone', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps firing an every-minute Etc/UTC task through the repeated hour', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(new Date('2026-10-25T00:30:00.000Z'));

    const fired: string[] = [];
    const missed: string[] = [];
    const runner = new Runner(new TimeMatcher('* * * * *', 'Etc/UTC'), (date: Date) => {
      fired.push(date.toISOString());
    }, {
      noOverlap: true,
      onMissedExecution: (date: Date) => { missed.push(date.toISOString()); }
    });

    // Count heartbeats so a zero-delay spin is visible. Node clamps delays
    // below 1ms to 1ms; emulate that so a spin still advances the fake clock
    // the way it does for real.
    let beats = 0;
    const realSetTimeout = globalThis.setTimeout;
    const spy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: any, ms?: number) => {
      beats++;
      return realSetTimeout(fn, Math.max(1, ms ?? 0));
    }) as any);

    runner.start();
    // 00:30Z -> 03:00Z: 30 min before the transition, the whole repeated hour
    // (01:00Z-02:00Z) and one hour after it.
    for (let i = 0; i < 150 * 60; i++) {
      await vi.advanceTimersByTimeAsync(1000);
    }
    runner.stop();
    spy.mockRestore();

    const inRepeatedHour = fired.filter(d => d >= '2026-10-25T01:00:00.000Z' && d < '2026-10-25T02:00:00.000Z');
    console.log(`process TZ=${process.env.TZ ?? '(system)'} fired=${fired.length} inRepeatedHour=${inRepeatedHour.length} missed=${missed.length} beats=${beats}`);
    console.log(`firstMissed=${missed[0]} lastMissed=${missed.at(-1)} firstFiredAfterTransition=${fired.find(d => d >= '2026-10-25T01:00:00.000Z')}`);

    expect(missed).toEqual([]);
    expect(inRepeatedHour.length).toBe(60);
    expect(fired.length).toBe(150);
  }, 300000);
});
