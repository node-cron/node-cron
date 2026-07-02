import { fork } from 'child_process';
import { EventEmitter } from 'events';
import { createTask, getTasks, shutdown, setLogger } from './node-cron';
import { resetLogger } from './logger';
import { ScheduledTask } from './tasks/scheduled-task';

// Background tasks fork a daemon process; the daemon artifact only exists in
// the built output, so fork() is mocked with a fake child that replays the
// task lifecycle events. The real fork path is covered against the build.
vi.mock('child_process', () => ({ fork: vi.fn() }));

const noopLogger: any = { error() {}, warn() {}, info() {}, debug() {} };

function idleTask(expression = '* * * * * *'): ScheduledTask {
  return createTask(expression, () => 'ok', { logger: noopLogger });
}

/**
 * A minimal ScheduledTask double whose stop()/destroy() reject, to exercise
 * shutdown()'s handling of a rejecting task without going through a real
 * background daemon. Inserted directly into the registry (getTasks() returns
 * the live Map), so it must be removed again by the test.
 */
function makeRejectingTask(id: string, stopRejectsWith: any = new Error('Stop operation timed out'), destroyRejectsWith: any = new Error('Destroy operation timed out')): ScheduledTask {
  const emitter = new EventEmitter();
  let state = 'stopped';
  return {
    id,
    name: id,
    isBusy: () => false,
    getStatus: () => state,
    stop: () => Promise.reject(stopRejectsWith),
    destroy: () => { state = 'destroyed'; return Promise.reject(destroyRejectsWith); },
    on: (event: any, fn: any) => emitter.on(event, fn),
    off: (event: any, fn: any) => emitter.off(event, fn),
    once: (event: any, fn: any) => emitter.once(event, fn),
  } as unknown as ScheduledTask;
}

/**
 * Creates an inline task whose scheduled execution blocks until `unblock()` is called.
 * The task uses '* * * * * *' (every second) and starts immediately so it fires soon.
 * Returns the task and a function to unblock the running execution.
 */
function makeBusyTask(): { task: ScheduledTask; unblock: () => void } {
  let unblock!: () => void;
  const blocker = new Promise<void>(resolve => { unblock = resolve; });

  const task = createTask('* * * * * *', () => blocker, { logger: noopLogger });
  task.start();
  return { task, unblock };
}

/**
 * Wait until isBusy() returns true, with a timeout to avoid hanging tests.
 */
function waitUntilBusy(task: ScheduledTask, timeoutMs = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error('Task did not become busy')), timeoutMs);
    const check = () => {
      if (task.isBusy()) {
        clearTimeout(deadline);
        resolve();
      } else {
        setImmediate(check);
      }
    };
    check();
  });
}

afterEach(async () => {
  // Clean up any lingering tasks between tests
  for (const task of getTasks().values()) {
    try {
      if (task.getStatus() !== 'destroyed') {
        task.destroy();
      }
    } catch { /* ignore */ }
  }
});

describe('shutdown', () => {
  it('resolves immediately when no tasks are registered', async () => {
    for (const task of getTasks().values()) {
      task.destroy();
    }
    await shutdown();
  });

  it('stops and destroys all idle tasks', async () => {
    const t1 = idleTask();
    const t2 = idleTask();
    t1.start();
    t2.start();

    await shutdown();

    expect(t1.getStatus()).toBe('destroyed');
    expect(t2.getStatus()).toBe('destroyed');
  });

  it('registry is empty after shutdown', async () => {
    idleTask();
    idleTask();

    await shutdown();

    expect(getTasks().size).toBe(0);
  });

  it('waits for a busy task to finish before destroying', async () => {
    const { task, unblock } = makeBusyTask();

    // Wait for the scheduled execution to actually start
    await waitUntilBusy(task);
    expect(task.isBusy()).toBe(true);

    // Unblock the task after a short delay
    setTimeout(unblock, 20);

    await shutdown(500);

    expect(task.getStatus()).toBe('destroyed');
  });

  it('waits for multiple busy tasks to finish', async () => {
    const b1 = makeBusyTask();
    const b2 = makeBusyTask();

    await waitUntilBusy(b1.task);
    await waitUntilBusy(b2.task);

    expect(b1.task.isBusy()).toBe(true);
    expect(b2.task.isBusy()).toBe(true);

    setTimeout(b1.unblock, 10);
    setTimeout(b2.unblock, 30);

    await shutdown(500);

    expect(b1.task.getStatus()).toBe('destroyed');
    expect(b2.task.getStatus()).toBe('destroyed');
  });

  it('destroys tasks after timeout even when still busy', async () => {
    // Never unblock - task stays busy forever
    const { task } = makeBusyTask();

    await waitUntilBusy(task);
    expect(task.isBusy()).toBe(true);

    const start = Date.now();
    await shutdown(50);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThan(40);
    expect(elapsed).toBeLessThan(500);
    expect(task.getStatus()).toBe('destroyed');
  });

  it('uses 5000 ms as the default timeout (does not hang on short busy tasks)', async () => {
    const { task, unblock } = makeBusyTask();

    await waitUntilBusy(task);

    // Unblock quickly so the default timeout is never hit
    setTimeout(unblock, 10);

    const start = Date.now();
    await shutdown(); // no timeout arg - uses default 5000
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000);
    expect(task.getStatus()).toBe('destroyed');
  });

  it('is safe to call when no tasks exist', async () => {
    for (const task of getTasks().values()) {
      task.destroy();
    }
    await shutdown();
    await shutdown();
  });

  describe('does not crash on a rejecting stop()/destroy()', () => {
    it('never surfaces an unhandled rejection when stop() and destroy() reject, and logs the failure', async () => {
      const unhandled: any[] = [];
      const onUnhandledRejection = (reason: any) => unhandled.push(reason);
      process.on('unhandledRejection', onUnhandledRejection);

      const errorFn = vi.fn();
      setLogger({ error: errorFn, warn() {}, info() {}, debug() {} });

      const id = 'rejecting-task';
      getTasks().set(id, makeRejectingTask(id));

      try {
        // Resolves cleanly: the rejections from stop()/destroy() are caught
        // internally instead of being left as unhandled rejections.
        await expect(shutdown(50)).resolves.toBeUndefined();

        // Give the microtask/macrotask queue a chance to surface any
        // unhandled rejection that shutdown() failed to catch.
        await new Promise(r => setTimeout(r, 50));

        expect(unhandled).toEqual([]);

        // Both the stop() and destroy() rejections are logged through
        // node-cron's own Logger instead of being silently swallowed.
        const messages = errorFn.mock.calls.map((call: any[]) => call[0]);
        expect(messages.some((m: string) => m.includes('Stop operation timed out'))).toBe(true);
        expect(messages.some((m: string) => m.includes('Destroy operation timed out'))).toBe(true);
      } finally {
        process.off('unhandledRejection', onUnhandledRejection);
        getTasks().delete(id);
        resetLogger();
      }
    });

    it('logs a rejection that is not an Error instance without throwing', async () => {
      const unhandled: any[] = [];
      const onUnhandledRejection = (reason: any) => unhandled.push(reason);
      process.on('unhandledRejection', onUnhandledRejection);

      const id = 'rejecting-task-non-error';
      getTasks().set(id, makeRejectingTask(id, 'stop failed', 'destroy failed'));

      try {
        await expect(shutdown(50)).resolves.toBeUndefined();
        await new Promise(r => setTimeout(r, 50));
        expect(unhandled).toEqual([]);
      } finally {
        process.off('unhandledRejection', onUnhandledRejection);
        getTasks().delete(id);
      }
    });
  });

  describe('listener cleanup and isBusy() race', () => {
    it('removes both the execution:finished and execution:failed listeners it registers', async () => {
      const { task, unblock } = makeBusyTask();
      const emitter = (task as any).emitter;

      await waitUntilBusy(task);
      setTimeout(unblock, 10);

      await shutdown(500);

      expect(emitter.listenerCount('execution:finished')).toBe(0);
      expect(emitter.listenerCount('execution:failed')).toBe(0);
    });

    it('does not leak a listener when the task fails instead of finishing', async () => {
      let fail!: () => void;
      const failing = new Promise((_, reject) => { fail = () => reject(new Error('boom')); });
      const task = createTask('* * * * * *', () => failing, { logger: noopLogger });
      task.start();
      const emitter = (task as any).emitter;

      await waitUntilBusy(task);
      setTimeout(fail, 10);

      await shutdown(500);

      expect(emitter.listenerCount('execution:finished')).toBe(0);
      expect(emitter.listenerCount('execution:failed')).toBe(0);
    });

    it('does not wait the full timeout when the task finishes right after stop() is requested', async () => {
      const { task, unblock } = makeBusyTask();

      await waitUntilBusy(task);

      // Unblock as soon as possible - the task settles essentially in the
      // same window shutdown() reads isBusy()/registers its listeners.
      queueMicrotask(unblock);

      const start = Date.now();
      await shutdown(2000);
      const elapsed = Date.now() - start;

      // Resolved because the execution actually finished, not because the
      // full 2000ms timeout elapsed.
      expect(elapsed).toBeLessThan(500);
      expect(task.getStatus()).toBe('destroyed');
    });
  });

  describe('waits for an in-progress background execution before killing the daemon', () => {
    function makeFakeChild() {
      const child: any = new EventEmitter();
      child.killed = false;
      child.kill = vi.fn(() => { child.killed = true; });
      child.send = vi.fn((msg: any) => {
        if (msg.command === 'task:start') {
          queueMicrotask(() => child.emit('message', { event: 'task:started', context: { date: new Date().toISOString() } }));
        }
        if (msg.command === 'task:stop') {
          // The daemon stops scheduling new runs immediately, but
          // must not report task:stopped as if the in-flight execution were
          // over - execution:finished is reported later, on its own.
          queueMicrotask(() => child.emit('message', {
            event: 'task:stopped',
            context: { date: new Date().toISOString(), task: { state: 'stopped' } }
          }));
        }
        return true;
      });
      return child;
    }

    afterEach(() => {
      vi.mocked(fork).mockReset();
    });

    it('waits for the in-flight execution to finish before killing the daemon, within the timeout', async () => {
      const child = makeFakeChild();
      vi.mocked(fork).mockReturnValue(child);

      const task = createTask('* * * * * *', './test-assets/dummy-task.js', { logger: noopLogger });
      await task.start();

      // The daemon reports an execution in progress.
      child.emit('message', {
        event: 'execution:started',
        context: {
          date: new Date().toISOString(),
          task: { state: 'running' },
          execution: { id: 'e1', reason: 'scheduled', startedAt: new Date().toISOString() }
        }
      });
      expect(task.isBusy()).toBe(true);

      let finishedFired = false;
      let killedWhenFinishedFired: boolean | undefined;
      task.once('execution:finished', () => {
        finishedFired = true;
        killedWhenFinishedFired = (child.kill as any).mock.calls.length > 0;
      });

      // The execution reports back only after a short delay.
      setTimeout(() => {
        child.emit('message', {
          event: 'execution:finished',
          context: {
            date: new Date().toISOString(),
            task: { state: 'idle' },
            execution: { id: 'e1', reason: 'scheduled', startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), result: 'ok' }
          }
        });
      }, 30);

      const shutdownPromise = shutdown(2000);

      // task:stop has been sent and task:stopped processed by now (both are
      // queueMicrotask), but the execution has not finished yet: the daemon
      // must not have been killed already.
      await wait(10);
      expect(child.kill).not.toHaveBeenCalled();

      const start = Date.now();
      await shutdownPromise;
      const elapsed = Date.now() - start;

      expect(finishedFired).toBe(true);
      // The daemon was not killed before its in-flight execution reported back.
      expect(killedWhenFinishedFired).toBe(false);
      // shutdown() did not wait for the full timeout either.
      expect(elapsed).toBeLessThan(1000);
      expect(child.kill).toHaveBeenCalled();
    });
  });
});

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
