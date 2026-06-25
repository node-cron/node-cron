import { Runner } from './runner';
import { TimeMatcher } from '../time/time-matcher';
import { createTask } from '../node-cron';

describe('scheduler/runner unref', function () {
  it('heartbeat timeout has ref by default', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {});
    runner.start();

    expect(runner.heartBeatTimeout!.hasRef()).toBe(true);

    runner.stop();
  });

  it('heartbeat timeout is unref\'d when unref option is true', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {}, { unref: true });
    runner.start();

    expect(runner.heartBeatTimeout!.hasRef()).toBe(false);

    runner.stop();
  });

  it('heartbeat stays unref\'d after stop and restart', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {}, { unref: true });

    runner.start();
    expect(runner.heartBeatTimeout!.hasRef()).toBe(false);
    runner.stop();

    runner.start();
    expect(runner.heartBeatTimeout!.hasRef()).toBe(false);
    runner.stop();
  });

  it('setUnref(true) unrefs a running heartbeat immediately', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {});
    runner.start();

    expect(runner.heartBeatTimeout!.hasRef()).toBe(true);
    runner.setUnref(true);
    expect(runner.heartBeatTimeout!.hasRef()).toBe(false);

    runner.stop();
  });

  it('setUnref(false) re-refs a running heartbeat immediately', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {}, { unref: true });
    runner.start();

    expect(runner.heartBeatTimeout!.hasRef()).toBe(false);
    runner.setUnref(false);
    expect(runner.heartBeatTimeout!.hasRef()).toBe(true);

    runner.stop();
  });

  it('jitter timeout is unref\'d when unref option is true', async function () {
    const origRandom = Math.random;
    Math.random = () => 0.999;

    const timeMatcher = new TimeMatcher('* * * * * *');
    let jitterUnrefed = false;

    const runner = new Runner(timeMatcher, async () => {}, {
      maxRandomDelay: 30000,
      unref: true,
    });

    // Patch start to observe jitterTimeout after it's set
    const origStart = runner.start.bind(runner);
    runner.start = function () {
      origStart();
      // Poll until jitterTimeout is set, then check hasRef
      const check = () => {
        const jt = (runner as any).jitterTimeout;
        if (jt) {
          jitterUnrefed = !jt.hasRef();
        }
      };
      // Check after the heartbeat fires (~1s + small margin)
      setTimeout(check, 1500);
    };

    runner.start();

    await new Promise(resolve => setTimeout(resolve, 2000));
    Math.random = origRandom;
    runner.stop();

    expect(jitterUnrefed).toBe(true);
  });

  it('setUnref(false) re-refs jitter timeout when active', async function () {
    const origRandom = Math.random;
    Math.random = () => 0.999;

    const timeMatcher = new TimeMatcher('* * * * * *');
    let jitterRefed = false;

    const runner = new Runner(timeMatcher, async () => {}, {
      maxRandomDelay: 30000,
      unref: true,
    });

    const origStart = runner.start.bind(runner);
    runner.start = function () {
      origStart();
      setTimeout(() => {
        const jt = (runner as any).jitterTimeout;
        if (jt) {
          expect(jt.hasRef()).toBe(false);
          runner.setUnref(false);
          jitterRefed = jt.hasRef();
        }
      }, 1500);
    };

    runner.start();

    await new Promise(resolve => setTimeout(resolve, 2000));
    Math.random = origRandom;
    runner.stop();

    expect(jitterRefed).toBe(true);
  });
  it('setUnref on a stopped runner is a no-op (no timeouts to change)', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {});

    runner.setUnref(true);
    expect(runner.unref).toBe(true);

    runner.setUnref(false);
    expect(runner.unref).toBe(false);
  });

  it('setUnref(true) unrefs an active jitter timeout', async function () {
    const origRandom = Math.random;
    Math.random = () => 0.999;

    const timeMatcher = new TimeMatcher('* * * * * *');
    let jitterUnrefed = false;

    const runner = new Runner(timeMatcher, async () => {}, {
      maxRandomDelay: 30000,
    });

    const origStart = runner.start.bind(runner);
    runner.start = function () {
      origStart();
      setTimeout(() => {
        const jt = (runner as any).jitterTimeout;
        if (jt) {
          runner.setUnref(true);
          jitterUnrefed = !jt.hasRef();
        }
      }, 1500);
    };

    runner.start();

    await new Promise(resolve => setTimeout(resolve, 2000));
    Math.random = origRandom;
    runner.stop();

    expect(jitterUnrefed).toBe(true);
  });
});

const noopLogger: any = { error() {}, warn() {}, info() {}, debug() {} };

describe('task.unref() / task.ref()', function () {
  it('task.unref() unrefs the heartbeat on a running task', function () {
    const task: any = createTask('* * * * * *', () => {}, { logger: noopLogger });
    task.start();

    expect(task.runner.heartBeatTimeout!.hasRef()).toBe(true);
    task.unref();
    expect(task.runner.heartBeatTimeout!.hasRef()).toBe(false);

    task.destroy();
  });

  it('task.ref() re-refs the heartbeat after unref', function () {
    const task: any = createTask('* * * * * *', () => {}, { logger: noopLogger, unref: true });
    task.start();

    expect(task.runner.heartBeatTimeout!.hasRef()).toBe(false);
    task.ref();
    expect(task.runner.heartBeatTimeout!.hasRef()).toBe(true);

    task.destroy();
  });
});
