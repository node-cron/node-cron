import { assert } from 'chai';
import { Runner } from './runner';
import { TimeMatcher } from '../time/time-matcher';
import { createTask } from '../node-cron';

describe('scheduler/runner unref', function () {
  it('heartbeat timeout has ref by default', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {});
    runner.start();

    assert.isTrue(runner.heartBeatTimeout!.hasRef());

    runner.stop();
  });

  it('heartbeat timeout is unref\'d when unref option is true', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {}, { unref: true });
    runner.start();

    assert.isFalse(runner.heartBeatTimeout!.hasRef());

    runner.stop();
  });

  it('heartbeat stays unref\'d after stop and restart', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {}, { unref: true });

    runner.start();
    assert.isFalse(runner.heartBeatTimeout!.hasRef());
    runner.stop();

    runner.start();
    assert.isFalse(runner.heartBeatTimeout!.hasRef());
    runner.stop();
  });

  it('setUnref(true) unrefs a running heartbeat immediately', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {});
    runner.start();

    assert.isTrue(runner.heartBeatTimeout!.hasRef());
    runner.setUnref(true);
    assert.isFalse(runner.heartBeatTimeout!.hasRef());

    runner.stop();
  });

  it('setUnref(false) re-refs a running heartbeat immediately', function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {}, { unref: true });
    runner.start();

    assert.isFalse(runner.heartBeatTimeout!.hasRef());
    runner.setUnref(false);
    assert.isTrue(runner.heartBeatTimeout!.hasRef());

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

    assert.isTrue(jitterUnrefed, 'jitter timeout should be unref\'d when unref option is true');
  });
});

const noopLogger: any = { error() {}, warn() {}, info() {}, debug() {} };

describe('task.unref() / task.ref()', function () {
  it('task.unref() unrefs the heartbeat on a running task', function () {
    const task: any = createTask('* * * * * *', () => {}, { logger: noopLogger });
    task.start();

    assert.isTrue(task.runner.heartBeatTimeout!.hasRef());
    task.unref();
    assert.isFalse(task.runner.heartBeatTimeout!.hasRef());

    task.destroy();
  });

  it('task.ref() re-refs the heartbeat after unref', function () {
    const task: any = createTask('* * * * * *', () => {}, { logger: noopLogger, unref: true });
    task.start();

    assert.isFalse(task.runner.heartBeatTimeout!.hasRef());
    task.ref();
    assert.isTrue(task.runner.heartBeatTimeout!.hasRef());

    task.destroy();
  });
});
