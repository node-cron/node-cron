import { InlineScheduledTask } from '../tasks/inline-scheduled-task';

// The runner must keep firing across DST transitions of the *process* time
// zone. CI runs with TZ=UTC, so these tests set a DST-observing zone themselves.
// The tasks use `timezone: 'UTC'` so that only the process zone is exercised
// (wall-clock matching in a DST task zone is a separate, documented behaviour).

const MINUTE = 60_000;
// More timers than this armed within one fake second means the runner is
// spinning (re-arming a 0 ms heartbeat) instead of waiting for the next slot.
const MAX_TIMERS_PER_SECOND = 100;

type Run = {
  started: number[];
  missed: number;
};

describe('scheduler/runner DST in the process time zone', function(){
  let originalTZ: string | undefined;
  let fakeSetTimeout: typeof setTimeout | undefined;
  let spinning: string | undefined;

  beforeAll(function(){
    originalTZ = process.env.TZ;
    process.env.TZ = 'Europe/Warsaw';
  });

  afterAll(function(){
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  });

  afterEach(function(){
    // Unwrap before handing the clock back to vitest.
    if (fakeSetTimeout) {
      globalThis.setTimeout = fakeSetTimeout;
      fakeSetTimeout = undefined;
    }
    vi.useRealTimers();
  });

  function useClock(now: string){
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'], now: new Date(now) });

    spinning = undefined;
    fakeSetTimeout = globalThis.setTimeout;
    const original = fakeSetTimeout;
    let second = -1;
    let armed = 0;

    const guarded = ((fn: (...args: any[]) => void, delay?: number, ...args: any[]) => {
      if (spinning) {
        // Park the runner so advancing the clock can return.
        return original(() => {}, 2 ** 31 - 1);
      }
      const current = Math.floor(Date.now() / 1000);
      if (current !== second) {
        second = current;
        armed = 0;
      }
      if (++armed > MAX_TIMERS_PER_SECOND) {
        spinning = `runner armed more than ${MAX_TIMERS_PER_SECOND} timers at ${new Date().toISOString()} (last delay ${delay} ms)`;
        return original(() => {}, 2 ** 31 - 1);
      }
      return original(fn, delay, ...args);
    }) as typeof setTimeout;
    globalThis.setTimeout = guarded;
  }

  async function advanceTo(until: string){
    const end = new Date(until).getTime();
    while (Date.now() < end) {
      await vi.advanceTimersByTimeAsync(Math.min(MINUTE, end - Date.now()));
      if (spinning) throw new Error(`Runner is spinning: ${spinning}`);
    }
  }

  async function runEveryMinute(from: string, until: string): Promise<Run> {
    useClock(from);
    const run: Run = { started: [], missed: 0 };

    const task = new InlineScheduledTask('* * * * *', () => {}, { timezone: 'UTC' });
    task.on('execution:started', () => { run.started.push(Date.now()); });
    task.on('execution:missed', () => { run.missed++; });

    task.start();
    try {
      await advanceTo(until);
    } finally {
      task.destroy();
    }
    return run;
  }

  function expectEveryMinute(run: Run, count: number){
    expect(run.missed).toBe(0);
    expect(run.started).toHaveLength(count);
    for (let i = 1; i < run.started.length; i++) {
      expect(run.started[i] - run.started[i - 1]).toBeLessThanOrEqual(MINUTE);
    }
  }

  it('fires every minute through the fall-back night', async function(){
    // Europe/Warsaw falls back at 2026-10-25T01:00Z (03:00 CEST -> 02:00 CET).
    const run = await runEveryMinute('2026-10-24T23:00:00.000Z', '2026-10-25T03:00:00.000Z');
    expectEveryMinute(run, 240);
  });

  it('fires every minute when started inside the repeated hour', async function(){
    // 2026-10-25T01:30Z is the second 02:30 local time (CET).
    const run = await runEveryMinute('2026-10-25T01:30:00.000Z', '2026-10-25T03:00:00.000Z');
    expectEveryMinute(run, 90);
  });

  it('fires every minute through the spring-forward night', async function(){
    // Europe/Warsaw springs forward at 2027-03-28T01:00Z (02:00 CET -> 03:00 CEST).
    const run = await runEveryMinute('2027-03-27T23:00:00.000Z', '2027-03-28T03:00:00.000Z');
    expectEveryMinute(run, 240);
  });
});
