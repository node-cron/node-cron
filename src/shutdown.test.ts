import { createTask, getTasks, shutdown } from './node-cron';
import { ScheduledTask } from './tasks/scheduled-task';

const noopLogger: any = { error() {}, warn() {}, info() {}, debug() {} };

function idleTask(expression = '* * * * * *'): ScheduledTask {
  return createTask(expression, () => 'ok', { logger: noopLogger });
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
});
