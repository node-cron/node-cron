import { createTask } from './node-cron';
import { ScheduledTask, TaskContext, TaskEvent } from './tasks/scheduled-task';
import { EventEmitter } from 'events';
import { fork } from 'child_process';

vi.mock('child_process', () => ({ fork: vi.fn() }));

const noopLogger: any = { error() {}, warn() {}, info() {}, debug() {} };

// -- helpers --

function waitFor(task: ScheduledTask, event: TaskEvent): Promise<TaskContext> {
  return new Promise(resolve => task.once(event, resolve));
}

// -- inline factory --

type FactoryOpts = { fail?: boolean, expression?: string };

function inlineTask(opts?: FactoryOpts): ScheduledTask {
  const expression = opts?.expression ?? '* * * * * *';
  const fn = opts?.fail
    ? () => { throw new Error('task failed'); }
    : () => 'ok';
  return createTask(expression, fn, { logger: noopLogger });
}

// -- background mock & factory --

function makeFakeChild(opts?: { fail?: boolean }) {
  const child: any = new EventEmitter();
  child.killed = false;
  child.kill = () => { child.killed = true; };
  child.send = (msg: any) => {
    const now = new Date().toISOString();
    if (msg.command === 'task:start') {
      queueMicrotask(() => child.emit('message', {
        event: 'task:started',
        context: { date: now }
      }));
    } else if (msg.command === 'task:stop') {
      queueMicrotask(() => child.emit('message', {
        event: 'task:stopped',
        context: { date: now }
      }));
    } else if (msg.command === 'task:destroy') {
      queueMicrotask(() => child.emit('message', {
        event: 'task:destroyed',
        context: { date: now }
      }));
    } else if (msg.command === 'task:execute') {
      const id = 'exec-' + Math.floor(Math.random() * 1e9);
      queueMicrotask(() => {
        child.emit('message', {
          event: 'execution:started',
          context: { date: now, execution: { id, reason: 'invoked', startedAt: now } }
        });
        queueMicrotask(() => {
          if (opts?.fail) {
            child.emit('message', {
              event: 'execution:failed',
              context: { date: now, execution: { id, reason: 'invoked', startedAt: now, finishedAt: now, hasError: true } },
              jsonError: JSON.stringify({ name: 'Error', message: 'task failed' })
            });
          } else {
            child.emit('message', {
              event: 'execution:finished',
              context: { date: now, execution: { id, reason: 'invoked', startedAt: now, finishedAt: now, result: 'ok' } }
            });
          }
        });
      });
    }
    return true;
  };
  return child;
}

function backgroundTask(opts?: FactoryOpts): ScheduledTask {
  vi.mocked(fork).mockImplementation(() => makeFakeChild({ fail: opts?.fail }) as any);
  const expression = opts?.expression ?? '* * * * * *';
  return createTask(expression, '/tmp/dummy-task.js', { logger: noopLogger });
}

// -- shared lifecycle suite --

function lifecycleSuite(label: string, factory: (opts?: FactoryOpts) => ScheduledTask) {
  describe(label, function() {
    let task: ScheduledTask;

    afterEach(async () => {
      try {
        if (task && task.getStatus() !== 'destroyed') {
          await task.destroy();
        }
      } catch { /* already cleaned up */ }
    });

    // -- state transitions --

    it('starts in stopped state', () => {
      task = factory();
      expect(task.getStatus()).toBe('stopped');
    });

    it('transitions to idle on start', async () => {
      task = factory();
      await task.start();
      expect(task.getStatus()).toBe('idle');
    });

    it('emits task:started on start', async () => {
      task = factory();
      const event = waitFor(task, 'task:started');
      await task.start();
      const ctx = await event;
      expect(ctx.date).toBeDefined();
    });

    it('transitions to stopped on stop', async () => {
      task = factory();
      await task.start();
      await task.stop();
      expect(task.getStatus()).toBe('stopped');
    });

    it('emits task:stopped on stop', async () => {
      task = factory();
      await task.start();
      const event = waitFor(task, 'task:stopped');
      await task.stop();
      await event;
    });

    it('can restart after stop', async () => {
      task = factory();
      await task.start();
      await task.stop();
      expect(task.getStatus()).toBe('stopped');
      await task.start();
      expect(task.getStatus()).toBe('idle');
    });

    it('transitions to destroyed on destroy', async () => {
      task = factory();
      await task.start();
      await task.destroy();
      expect(task.getStatus()).toBe('destroyed');
    });

    it('emits task:destroyed on destroy', async () => {
      task = factory();
      await task.start();
      const event = waitFor(task, 'task:destroyed');
      await task.destroy();
      await event;
    });

    it('destroy is idempotent', async () => {
      task = factory();
      await task.start();
      await task.destroy();
      await task.destroy();
      expect(task.getStatus()).toBe('destroyed');
    });

    // -- execution --

    it('emits execution:started and execution:finished on execute', async () => {
      task = factory();
      await task.start();

      const events: TaskEvent[] = [];
      task.on('execution:started', () => events.push('execution:started'));
      task.on('execution:finished', () => events.push('execution:finished'));

      await task.execute();

      expect(events).toContain('execution:started');
      expect(events).toContain('execution:finished');
    });

    it('execute resolves with the task result', async () => {
      task = factory();
      await task.start();
      const result = await task.execute();
      expect(result).toBe('ok');
    });

    it('emits execution:failed when task throws', async () => {
      task = factory({ fail: true });
      await task.start();

      let failCtx: TaskContext | undefined;
      task.on('execution:failed', (ctx) => { failCtx = ctx; });

      try { await task.execute(); } catch { /* expected */ }

      expect(failCtx).toBeDefined();
      expect(failCtx!.execution?.error).toBeDefined();
      expect(failCtx!.execution!.error!.message).toBe('task failed');
    });

    it('execute rejects when task throws', async () => {
      task = factory({ fail: true });
      await task.start();

      try {
        await task.execute();
        expect.fail('should have rejected');
      } catch (err: any) {
        expect(err.message).toBe('task failed');
      }
    });

    it('records lastRun after successful execution', async () => {
      task = factory();
      await task.start();
      expect(task.lastRun()).toBeNull();

      await task.execute();

      const last = task.lastRun();
      expect(last).not.toBeNull();
      expect(last!.date).toBeInstanceOf(Date);
      expect(last!.result).toBe('ok');
      expect(last!.error).toBeUndefined();
    });

    it('records lastRun after failed execution', async () => {
      task = factory({ fail: true });
      await task.start();

      try { await task.execute(); } catch { /* expected */ }

      const last = task.lastRun();
      expect(last).not.toBeNull();
      expect(last!.error).toBeDefined();
    });

    // -- no duplicate events --

    it('start emits task:started exactly once', async () => {
      task = factory();
      let count = 0;
      task.on('task:started', () => count++);
      await task.start();
      expect(count).toBe(1);
    });

    it('stop emits task:stopped exactly once', async () => {
      task = factory();
      await task.start();
      let count = 0;
      task.on('task:stopped', () => count++);
      await task.stop();
      expect(count).toBe(1);
    });

    it('destroy emits task:destroyed exactly once', async () => {
      task = factory();
      await task.start();
      let count = 0;
      task.on('task:destroyed', () => count++);
      await task.destroy();
      expect(count).toBe(1);
    });

    it('execute emits execution:started and execution:finished exactly once each', async () => {
      task = factory();
      await task.start();
      let started = 0;
      let finished = 0;
      task.on('execution:started', () => started++);
      task.on('execution:finished', () => finished++);
      await task.execute();
      expect(started).toBe(1);
      expect(finished).toBe(1);
    });

    it('failed execute emits execution:started and execution:failed exactly once each', async () => {
      task = factory({ fail: true });
      await task.start();
      let started = 0;
      let failed = 0;
      task.on('execution:started', () => started++);
      task.on('execution:failed', () => failed++);
      try { await task.execute(); } catch { /* expected */ }
      expect(started).toBe(1);
      expect(failed).toBe(1);
    });

    // -- introspection --

    it('returns the cron pattern', () => {
      task = factory({ expression: '*/5 * * * *' });
      expect(task.getPattern()).toBe('*/5 * * * *');
    });

    it('returns next run when started', async () => {
      task = factory();
      await task.start();
      const next = task.getNextRun();
      expect(next).not.toBeNull();
      expect(next).toBeInstanceOf(Date);
    });

    it('returns null for next run when stopped', () => {
      task = factory();
      expect(task.getNextRun()).toBeNull();
    });

    it('has an id', () => {
      task = factory();
      expect(task.id).toBeDefined();
      expect(typeof task.id).toBe('string');
    });

    // -- full lifecycle e2e --

    it('full lifecycle: create -> start -> execute -> stop -> restart -> execute -> destroy', async () => {
      task = factory();

      // created
      expect(task.getStatus()).toBe('stopped');
      expect(task.lastRun()).toBeNull();

      // start
      await task.start();
      expect(task.getStatus()).toBe('idle');

      // first execution
      const result1 = await task.execute();
      expect(result1).toBe('ok');
      expect(task.lastRun()).not.toBeNull();

      // stop
      await task.stop();
      expect(task.getStatus()).toBe('stopped');
      expect(task.getNextRun()).toBeNull();

      // restart
      await task.start();
      expect(task.getStatus()).toBe('idle');
      expect(task.getNextRun()).not.toBeNull();

      // second execution
      const result2 = await task.execute();
      expect(result2).toBe('ok');

      // destroy
      await task.destroy();
      expect(task.getStatus()).toBe('destroyed');
    });
  });
}

// -- run suites --

describe('lifecycle', () => {
  lifecycleSuite('inline task', inlineTask);
  lifecycleSuite('background task', backgroundTask);
});
