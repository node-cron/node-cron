import { InlineScheduledTask } from './inline-scheduled-task';

describe('task introspection', function () {
  describe('getPattern', function () {
    it('returns the original cron expression', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {});
      expect(task.getPattern()).toBe('0 0 12 * * *');
    });
  });

  describe('match', function () {
    it('reports whether a date matches the expression', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {}, { timezone: 'Etc/UTC' });
      expect(task.match(new Date('2025-06-15T12:00:00Z'))).toBe(true);
      expect(task.match(new Date('2025-06-15T12:00:01Z'))).toBe(false);
    });
  });

  describe('getNextRuns', function () {
    it('returns the next N runs, strictly increasing, each matching', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {}, { timezone: 'Etc/UTC' });
      const runs = task.getNextRuns(3);
      expect(runs).toHaveLength(3);
      for (let i = 0; i < runs.length; i++) {
        expect(task.match(runs[i])).toBe(true);
        if (i > 0) expect(runs[i].getTime()).toBeGreaterThan(runs[i - 1].getTime());
      }
    });

    it('returns an empty array for a non-positive count', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {});
      expect(task.getNextRuns(0)).toEqual([]);
    });
  });

  describe('msToNext', function () {
    it('returns the milliseconds until the next run when started', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {}, { timezone: 'Etc/UTC' });
      task.start();
      const ms = task.msToNext();
      expect(ms).not.toBeNull();
      expect(ms as number).toBeGreaterThan(0);
      expect(Math.abs((ms as number) - ((task.getNextRun() as Date).getTime() - Date.now()))).toBeLessThanOrEqual(1000);
      task.stop();
    });

    it('returns null when the task is stopped', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {});
      expect(task.msToNext()).toBeNull();
    });
  });

  describe('isBusy', function () {
    it('is false when the task is not executing', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {});
      expect(task.isBusy()).toBe(false);
    });

    it('is true while an execution is in progress', async function () {
      // Gate the handler so the assertion is deterministic: wait for a run to
      // actually start (via the event), check, then release it — no reliance on
      // sampling at the right millisecond.
      let release!: () => void;
      const gate = new Promise<void>((r) => { release = r; });
      const task = new InlineScheduledTask('* * * * * *', async () => { await gate; });
      const started = new Promise<void>((r) => task.on('execution:started', () => r()));

      task.start();
      await started;
      expect(task.isBusy()).toBe(true);

      release();
      task.stop();
    });
  });

  describe('runsLeft', function () {
    it('returns the remaining executions when maxExecutions is set', function () {
      const task = new InlineScheduledTask('* * * * * *', () => {}, { maxExecutions: 3 });
      expect(task.runsLeft()).toBe(3);
    });

    it('returns undefined when maxExecutions is not set', function () {
      const task = new InlineScheduledTask('* * * * * *', () => {});
      expect(task.runsLeft()).toBeUndefined();
    });
  });

  describe('lastRun', function () {
    it('returns null before the first execution', function () {
      const task = new InlineScheduledTask('* * * * * *', () => {});
      expect(task.lastRun()).toBeNull();
    });

    it('returns the execution date and result after a successful run', async function () {
      const task = new InlineScheduledTask('* * * * * *', () => 'done');
      await task.execute();

      const last = task.lastRun();
      expect(last).not.toBeNull();
      expect(last!.date).toBeInstanceOf(Date);
      expect(last!.result).toBe('done');
      expect(last!.error).toBeUndefined();
    });

    it('returns the execution date and error after a failing run', async function () {
      const boom = new Error('boom');
      const task = new InlineScheduledTask('* * * * * *', () => { throw boom; });
      try {
        await task.execute();
      } catch {
        // execute() rejects on failure; lastRun must still be recorded.
      }

      const last = task.lastRun();
      expect(last).not.toBeNull();
      expect(last!.date).toBeInstanceOf(Date);
      expect(last!.error).toBe(boom);
      expect(last!.result).toBeUndefined();
    });

    it('reflects the actual execution time, not a tick check', async function () {
      // Delay the task so its real run finishes well after the task was created.
      // The recorded date must track the actual run, not an earlier tick check.
      const task = new InlineScheduledTask('* * * * * *', async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      const before = Date.now();
      await task.execute();
      const after = Date.now();

      const last = task.lastRun();
      expect(last).not.toBeNull();
      const ranAt = last!.date.getTime();
      expect(ranAt).toBeGreaterThanOrEqual(before);
      expect(ranAt).toBeLessThanOrEqual(after);
    });

    it('updates to the most recent execution on each run', async function () {
      let value = 'first';
      const task = new InlineScheduledTask('* * * * * *', () => value);

      await task.execute();
      expect(task.lastRun()!.result).toBe('first');

      value = 'second';
      await task.execute();
      expect(task.lastRun()!.result).toBe('second');
    });
  });
});
