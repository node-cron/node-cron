import { assert } from 'chai';
import { InlineScheduledTask } from '../tasks/inline-scheduled-task';
import { setRunCoordinator } from './run-coordinator';
import cron from '../node-cron';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const silent = { info() {}, warn() {}, error() {}, debug() {} } as any;

function makeCoordinator(behavior: { shouldRunReturns?: boolean; shouldRunThrows?: boolean; onCompleteThrows?: boolean } = {}) {
  const calls = { shouldRun: [] as { key: string; ttl: number }[], onComplete: [] as string[] };
  return {
    calls,
    async shouldRun(key: string, ttl: number) {
      calls.shouldRun.push({ key, ttl });
      if (behavior.shouldRunThrows) throw new Error('coordinator down');
      return behavior.shouldRunReturns ?? true;
    },
    async onComplete(key: string) {
      calls.onComplete.push(key);
      if (behavior.onCompleteThrows) throw new Error('onComplete failed');
    },
  };
}

describe('run coordinator', function () {
  afterEach(() => setRunCoordinator(undefined));

  it('elected instance runs, calls onComplete, emits no skipped', async function () {
    const coordinator = makeCoordinator();
    setRunCoordinator(coordinator as any);
    let ran = 0;
    let skipped = 0;
    const task = new InlineScheduledTask('* * * * * *', () => { ran++; }, { name: 'job', distributed: true });
    task.on('execution:skipped', () => skipped++);

    task.start();
    await wait(1200);
    task.stop();

    assert.isAbove(ran, 0);
    assert.isAbove(coordinator.calls.shouldRun.length, 0);
    assert.match(coordinator.calls.shouldRun[0].key, /^job:.+Z$/);
    assert.equal(coordinator.calls.shouldRun[0].ttl, 30000);
    assert.isAbove(coordinator.calls.onComplete.length, 0);
    assert.equal(skipped, 0);
  });

  it('not-elected instance emits skipped(not-elected) and does not run', async function () {
    const coordinator = makeCoordinator({ shouldRunReturns: false });
    setRunCoordinator(coordinator as any);
    let ran = 0;
    const reasons: string[] = [];
    const task = new InlineScheduledTask('* * * * * *', () => { ran++; }, { name: 'job', distributed: true });
    task.on('execution:skipped', (ctx) => reasons.push(ctx.reason as string));

    task.start();
    await wait(1200);
    task.stop();

    assert.equal(ran, 0, 'must not run when not elected');
    assert.isAbove(reasons.length, 0);
    assert.deepEqual([...new Set(reasons)], ['not-elected']);
    assert.equal(coordinator.calls.onComplete.length, 0, 'never completes a run it did not start');
  });

  it('fails closed and emits skipped(coordinator-error) when shouldRun throws', async function () {
    const coordinator = makeCoordinator({ shouldRunThrows: true });
    setRunCoordinator(coordinator as any);
    let ran = 0;
    const reasons: string[] = [];
    const task = new InlineScheduledTask('* * * * * *', () => { ran++; }, { name: 'job', distributed: true, logger: silent });
    task.on('execution:skipped', (ctx) => reasons.push(ctx.reason as string));

    task.start();
    await wait(1200);
    task.stop();

    assert.equal(ran, 0);
    assert.deepEqual([...new Set(reasons)], ['coordinator-error']);
  });

  it('runs even if onComplete fails', async function () {
    const coordinator = makeCoordinator({ onCompleteThrows: true });
    setRunCoordinator(coordinator as any);
    let ran = 0;
    const task = new InlineScheduledTask('* * * * * *', () => { ran++; }, { name: 'job', distributed: true, logger: silent });

    task.start();
    await wait(1200);
    task.stop();

    assert.isAbove(ran, 0);
  });

  it('honours a custom distributedTtl', async function () {
    const coordinator = makeCoordinator();
    setRunCoordinator(coordinator as any);
    const task = new InlineScheduledTask('* * * * * *', () => {}, { name: 'job', distributed: true, distributedTtl: 5000 });

    task.start();
    await wait(1200);
    task.stop();

    assert.equal(coordinator.calls.shouldRun[0].ttl, 5000);
  });

  it('uses a per-task runCoordinator over the global one', async function () {
    const global = makeCoordinator();
    const perTask = makeCoordinator();
    setRunCoordinator(global as any);
    const task = new InlineScheduledTask('* * * * * *', () => {}, { name: 'job', distributed: true, runCoordinator: perTask as any });

    task.start();
    await wait(1200);
    task.stop();

    assert.isAbove(perTask.calls.shouldRun.length, 0);
    assert.equal(global.calls.shouldRun.length, 0);
  });

  describe('createTask validation', function () {
    afterEach(() => {
      setRunCoordinator(undefined);
      delete process.env.NODE_CRON_RUN;
    });

    it('throws when distributed is set without a name', function () {
      setRunCoordinator(makeCoordinator() as any);
      assert.throws(() => cron.createTask('* * * * *', () => {}, { distributed: true }), /requires a `name`/);
    });

    it('accepts a per-task runCoordinator without a global one', function () {
      assert.doesNotThrow(() => cron.createTask('* * * * *', () => {}, { name: 'x', distributed: true, runCoordinator: makeCoordinator() as any }));
    });

    it('allows distributed on a background task when a coordinator is set', function () {
      setRunCoordinator(makeCoordinator() as any);
      assert.doesNotThrow(() =>
        cron.createTask('* * * * *', '../test-assets/dummy-task.js', { name: 'x', distributed: true })
      );
    });

    it('falls back to the env-var default and throws at schedule time when NODE_CRON_RUN is unset', function () {
      assert.throws(() => cron.createTask('* * * * *', () => {}, { name: 'x', distributed: true }), /NODE_CRON_RUN/);
    });

    it('uses the env-var default when NODE_CRON_RUN is set', function () {
      process.env.NODE_CRON_RUN = 'true';
      assert.doesNotThrow(() => cron.createTask('* * * * *', () => {}, { name: 'x', distributed: true }));
    });
  });
});
