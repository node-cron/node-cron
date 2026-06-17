import { assert } from 'chai';
import { InlineScheduledTask } from './inline-scheduled-task';

describe('task introspection', function () {
  describe('getPattern', function () {
    it('returns the original cron expression', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {});
      assert.equal(task.getPattern(), '0 0 12 * * *');
    });
  });

  describe('match', function () {
    it('reports whether a date matches the expression', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {}, { timezone: 'Etc/UTC' });
      assert.isTrue(task.match(new Date('2025-06-15T12:00:00Z')));
      assert.isFalse(task.match(new Date('2025-06-15T12:00:01Z')));
    });
  });

  describe('getNextRuns', function () {
    it('returns the next N runs, strictly increasing, each matching', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {}, { timezone: 'Etc/UTC' });
      const runs = task.getNextRuns(3);
      assert.lengthOf(runs, 3);
      for (let i = 0; i < runs.length; i++) {
        assert.isTrue(task.match(runs[i]), `run ${i} should match`);
        if (i > 0) assert.isAbove(runs[i].getTime(), runs[i - 1].getTime());
      }
    });

    it('returns an empty array for a non-positive count', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {});
      assert.deepEqual(task.getNextRuns(0), []);
    });
  });

  describe('msToNext', function () {
    it('returns the milliseconds until the next run when started', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {}, { timezone: 'Etc/UTC' });
      task.start();
      const ms = task.msToNext();
      assert.isNotNull(ms);
      assert.isAbove(ms as number, 0);
      assert.closeTo((ms as number), (task.getNextRun() as Date).getTime() - Date.now(), 1000);
      task.stop();
    });

    it('returns null when the task is stopped', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {});
      assert.isNull(task.msToNext());
    });
  });

  describe('isBusy', function () {
    it('is false when the task is not executing', function () {
      const task = new InlineScheduledTask('0 0 12 * * *', () => {});
      assert.isFalse(task.isBusy());
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
      assert.isTrue(task.isBusy());

      release();
      task.stop();
    });
  });

  describe('runsLeft', function () {
    it('returns the remaining executions when maxExecutions is set', function () {
      const task = new InlineScheduledTask('* * * * * *', () => {}, { maxExecutions: 3 });
      assert.equal(task.runsLeft(), 3);
    });

    it('returns undefined when maxExecutions is not set', function () {
      const task = new InlineScheduledTask('* * * * * *', () => {});
      assert.isUndefined(task.runsLeft());
    });
  });
});
