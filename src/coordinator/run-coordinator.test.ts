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

    expect(ran).toBeGreaterThan(0);
    expect(coordinator.calls.shouldRun.length).toBeGreaterThan(0);
    expect(coordinator.calls.shouldRun[0].key).toMatch(/^job:.+Z$/);
    expect(coordinator.calls.shouldRun[0].ttl).toBe(30000);
    expect(coordinator.calls.onComplete.length).toBeGreaterThan(0);
    expect(skipped).toBe(0);
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

    expect(ran).toBe(0);
    expect(reasons.length).toBeGreaterThan(0);
    expect([...new Set(reasons)]).toEqual(['not-elected']);
    expect(coordinator.calls.onComplete.length).toBe(0);
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

    expect(ran).toBe(0);
    expect([...new Set(reasons)]).toEqual(['coordinator-error']);
  });

  it('runs even if onComplete fails', async function () {
    const coordinator = makeCoordinator({ onCompleteThrows: true });
    setRunCoordinator(coordinator as any);
    let ran = 0;
    const task = new InlineScheduledTask('* * * * * *', () => { ran++; }, { name: 'job', distributed: true, logger: silent });

    task.start();
    await wait(1200);
    task.stop();

    expect(ran).toBeGreaterThan(0);
  });

  it('honours a custom distributedLease', async function () {
    const coordinator = makeCoordinator();
    setRunCoordinator(coordinator as any);
    const task = new InlineScheduledTask('* * * * * *', () => {}, { name: 'job', distributed: true, distributedLease: 5000 });

    task.start();
    await wait(1200);
    task.stop();

    expect(coordinator.calls.shouldRun[0].ttl).toBe(5000);
  });

  it('uses a per-task runCoordinator over the global one', async function () {
    const global = makeCoordinator();
    const perTask = makeCoordinator();
    setRunCoordinator(global as any);
    const task = new InlineScheduledTask('* * * * * *', () => {}, { name: 'job', distributed: true, runCoordinator: perTask as any });

    task.start();
    await wait(1200);
    task.stop();

    expect(perTask.calls.shouldRun.length).toBeGreaterThan(0);
    expect(global.calls.shouldRun.length).toBe(0);
  });

  describe('createTask validation', function () {
    afterEach(() => {
      setRunCoordinator(undefined);
      delete process.env.NODE_CRON_RUN;
    });

    it('throws when distributed is set without a name', function () {
      setRunCoordinator(makeCoordinator() as any);
      expect(() => cron.createTask('* * * * *', () => {}, { distributed: true })).toThrow(/requires a `name`/);
    });

    it('accepts a per-task runCoordinator without a global one', function () {
      expect(() => cron.createTask('* * * * *', () => {}, { name: 'x', distributed: true, runCoordinator: makeCoordinator() as any })).not.toThrow();
    });

    it('allows distributed on a background task when a coordinator is set', function () {
      setRunCoordinator(makeCoordinator() as any);
      expect(() =>
        cron.createTask('* * * * *', '../test-assets/dummy-task.js', { name: 'x', distributed: true })
      ).not.toThrow();
    });

    it('falls back to the env-var default and throws at schedule time when NODE_CRON_RUN is unset', function () {
      expect(() => cron.createTask('* * * * *', () => {}, { name: 'x', distributed: true })).toThrow(/NODE_CRON_RUN/);
    });

    it('uses the env-var default when NODE_CRON_RUN is set', function () {
      process.env.NODE_CRON_RUN = 'true';
      expect(() => cron.createTask('* * * * *', () => {}, { name: 'x', distributed: true })).not.toThrow();
    });
  });
});
