import { assert } from 'chai';
import { InlineScheduledTask } from '../tasks/inline-scheduled-task';
import { setLockProvider } from './lock-provider';
import cron from '../node-cron';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const silent = { info() {}, warn() {}, error() {}, debug() {} } as any;

function makeProvider(behavior: { acquireReturns?: boolean; acquireThrows?: boolean; releaseThrows?: boolean } = {}) {
  const calls = { acquire: [] as { key: string; ttl: number }[], release: [] as string[] };
  return {
    calls,
    async acquire(key: string, ttl: number) {
      calls.acquire.push({ key, ttl });
      if (behavior.acquireThrows) throw new Error('redis down');
      return behavior.acquireReturns ?? true;
    },
    async release(key: string) {
      calls.release.push(key);
      if (behavior.releaseThrows) throw new Error('release failed');
    },
  };
}

describe('distributed lock', function () {
  afterEach(() => setLockProvider(undefined));

  it('winner acquires, runs, releases, and emits locked then unlocked', async function () {
    const provider = makeProvider();
    setLockProvider(provider as any);
    let ran = 0;
    const events: string[] = [];
    const task = new InlineScheduledTask('* * * * * *', () => { ran++; }, { name: 'job', lock: true });
    task.on('execution:locked', () => events.push('locked'));
    task.on('execution:unlocked', () => events.push('unlocked'));

    task.start();
    await wait(1200);
    task.stop();

    assert.isAbove(ran, 0);
    assert.isAbove(provider.calls.acquire.length, 0);
    assert.match(provider.calls.acquire[0].key, /^job:.+Z$/);
    assert.equal(provider.calls.acquire[0].ttl, 30000);
    assert.isAbove(provider.calls.release.length, 0);
    assert.include(events, 'locked');
    assert.include(events, 'unlocked');
  });

  it('loser emits lockHeld and does not run', async function () {
    const provider = makeProvider({ acquireReturns: false });
    setLockProvider(provider as any);
    let ran = 0;
    let held = 0;
    const task = new InlineScheduledTask('* * * * * *', () => { ran++; }, { name: 'job', lock: true });
    task.on('execution:lockHeld', () => held++);

    task.start();
    await wait(1200);
    task.stop();

    assert.equal(ran, 0, 'must not run when the lock is held elsewhere');
    assert.isAbove(held, 0);
    assert.equal(provider.calls.release.length, 0, 'never release a lock it did not acquire');
  });

  it('fails closed (skips the run) when acquire throws', async function () {
    const provider = makeProvider({ acquireThrows: true });
    setLockProvider(provider as any);
    let ran = 0;
    const task = new InlineScheduledTask('* * * * * *', () => { ran++; }, { name: 'job', lock: true, logger: silent });

    task.start();
    await wait(1200);
    task.stop();

    assert.equal(ran, 0);
  });

  it('runs and emits unlocked even if release fails', async function () {
    const provider = makeProvider({ releaseThrows: true });
    setLockProvider(provider as any);
    let ran = 0;
    let unlocked = 0;
    const task = new InlineScheduledTask('* * * * * *', () => { ran++; }, { name: 'job', lock: true, logger: silent });
    task.on('execution:unlocked', () => unlocked++);

    task.start();
    await wait(1200);
    task.stop();

    assert.isAbove(ran, 0);
    assert.isAbove(unlocked, 0);
  });

  it('honours a custom lockTtl', async function () {
    const provider = makeProvider();
    setLockProvider(provider as any);
    const task = new InlineScheduledTask('* * * * * *', () => {}, { name: 'job', lock: true, lockTtl: 5000 });

    task.start();
    await wait(1200);
    task.stop();

    assert.equal(provider.calls.acquire[0].ttl, 5000);
  });

  describe('createTask validation', function () {
    afterEach(() => setLockProvider(undefined));

    it('throws when lock is set without a name', function () {
      setLockProvider(makeProvider() as any);
      assert.throws(() => cron.createTask('* * * * *', () => {}, { lock: true }), /requires a `name`/);
    });

    it('throws when lock is set without a provider', function () {
      assert.throws(() => cron.createTask('* * * * *', () => {}, { name: 'x', lock: true }), /requires a lock provider/);
    });

    it('throws when lock is set on a background task', function () {
      setLockProvider(makeProvider() as any);
      assert.throws(
        () => cron.createTask('* * * * *', '../test-assets/dummy-task.js', { name: 'x', lock: true }),
        /not supported for background/
      );
    });
  });
});
