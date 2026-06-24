import { assert } from 'chai';
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
      assert.equal(task.getStatus(), 'stopped');
    });

    it('transitions to idle on start', async () => {
      task = factory();
      await task.start();
      assert.equal(task.getStatus(), 'idle');
    });

    it('emits task:started on start', async () => {
      task = factory();
      const event = waitFor(task, 'task:started');
      await task.start();
      const ctx = await event;
      assert.isDefined(ctx.date);
    });

    it('transitions to stopped on stop', async () => {
      task = factory();
      await task.start();
      await task.stop();
      assert.equal(task.getStatus(), 'stopped');
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
      assert.equal(task.getStatus(), 'stopped');
      await task.start();
      assert.equal(task.getStatus(), 'idle');
    });

    it('transitions to destroyed on destroy', async () => {
      task = factory();
      await task.start();
      await task.destroy();
      assert.equal(task.getStatus(), 'destroyed');
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
      assert.equal(task.getStatus(), 'destroyed');
    });

    // -- execution --

    it('emits execution:started and execution:finished on execute', async () => {
      task = factory();
      await task.start();

      const events: TaskEvent[] = [];
      task.on('execution:started', () => events.push('execution:started'));
      task.on('execution:finished', () => events.push('execution:finished'));

      await task.execute();

      assert.include(events, 'execution:started');
      assert.include(events, 'execution:finished');
    });

    it('execute resolves with the task result', async () => {
      task = factory();
      await task.start();
      const result = await task.execute();
      assert.equal(result, 'ok');
    });

    it('emits execution:failed when task throws', async () => {
      task = factory({ fail: true });
      await task.start();

      let failCtx: TaskContext | undefined;
      task.on('execution:failed', (ctx) => { failCtx = ctx; });

      try { await task.execute(); } catch { /* expected */ }

      assert.isDefined(failCtx);
      assert.isDefined(failCtx!.execution?.error);
      assert.equal(failCtx!.execution!.error!.message, 'task failed');
    });

    it('execute rejects when task throws', async () => {
      task = factory({ fail: true });
      await task.start();

      try {
        await task.execute();
        assert.fail('should have rejected');
      } catch (err: any) {
        assert.equal(err.message, 'task failed');
      }
    });

    it('records lastRun after successful execution', async () => {
      task = factory();
      await task.start();
      assert.isNull(task.lastRun());

      await task.execute();

      const last = task.lastRun();
      assert.isNotNull(last);
      assert.instanceOf(last!.date, Date);
      assert.equal(last!.result, 'ok');
      assert.isUndefined(last!.error);
    });

    it('records lastRun after failed execution', async () => {
      task = factory({ fail: true });
      await task.start();

      try { await task.execute(); } catch { /* expected */ }

      const last = task.lastRun();
      assert.isNotNull(last);
      assert.isDefined(last!.error);
    });

    // -- no duplicate events --

    it('start emits task:started exactly once', async () => {
      task = factory();
      let count = 0;
      task.on('task:started', () => count++);
      await task.start();
      assert.equal(count, 1);
    });

    it('stop emits task:stopped exactly once', async () => {
      task = factory();
      await task.start();
      let count = 0;
      task.on('task:stopped', () => count++);
      await task.stop();
      assert.equal(count, 1);
    });

    it('destroy emits task:destroyed exactly once', async () => {
      task = factory();
      await task.start();
      let count = 0;
      task.on('task:destroyed', () => count++);
      await task.destroy();
      assert.equal(count, 1);
    });

    it('execute emits execution:started and execution:finished exactly once each', async () => {
      task = factory();
      await task.start();
      let started = 0;
      let finished = 0;
      task.on('execution:started', () => started++);
      task.on('execution:finished', () => finished++);
      await task.execute();
      assert.equal(started, 1);
      assert.equal(finished, 1);
    });

    it('failed execute emits execution:started and execution:failed exactly once each', async () => {
      task = factory({ fail: true });
      await task.start();
      let started = 0;
      let failed = 0;
      task.on('execution:started', () => started++);
      task.on('execution:failed', () => failed++);
      try { await task.execute(); } catch { /* expected */ }
      assert.equal(started, 1);
      assert.equal(failed, 1);
    });

    // -- introspection --

    it('returns the cron pattern', () => {
      task = factory({ expression: '*/5 * * * *' });
      assert.equal(task.getPattern(), '*/5 * * * *');
    });

    it('returns next run when started', async () => {
      task = factory();
      await task.start();
      const next = task.getNextRun();
      assert.isNotNull(next);
      assert.instanceOf(next, Date);
    });

    it('returns null for next run when stopped', () => {
      task = factory();
      assert.isNull(task.getNextRun());
    });

    it('has an id', () => {
      task = factory();
      assert.isDefined(task.id);
      assert.isString(task.id);
    });

    // -- full lifecycle e2e --

    it('full lifecycle: create -> start -> execute -> stop -> restart -> execute -> destroy', async () => {
      task = factory();

      // created
      assert.equal(task.getStatus(), 'stopped');
      assert.isNull(task.lastRun());

      // start
      await task.start();
      assert.equal(task.getStatus(), 'idle');

      // first execution
      const result1 = await task.execute();
      assert.equal(result1, 'ok');
      assert.isNotNull(task.lastRun());

      // stop
      await task.stop();
      assert.equal(task.getStatus(), 'stopped');
      assert.isNull(task.getNextRun());

      // restart
      await task.start();
      assert.equal(task.getStatus(), 'idle');
      assert.isNotNull(task.getNextRun());

      // second execution
      const result2 = await task.execute();
      assert.equal(result2, 'ok');

      // destroy
      await task.destroy();
      assert.equal(task.getStatus(), 'destroyed');
    });
  });
}

// -- run suites --

describe('lifecycle', () => {
  lifecycleSuite('inline task', inlineTask);
  lifecycleSuite('background task', backgroundTask);
});
