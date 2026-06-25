import { Runner, RunnerOptions } from './runner';
import { TimeMatcher } from '../time/time-matcher';

import logger from '../logger';

describe('scheduler/runner', function(){
  it('defaults the missed-execution tolerance to 1000ms', function(){
    const runner = createRunner(new TimeMatcher('* * * * * *'), 200);
    expect(runner.missedExecutionTolerance).toBe(1000);
  });

  it('honours a custom missed-execution tolerance', function(){
    const runner = createRunner(new TimeMatcher('* * * * * *'), 200, { missedExecutionTolerance: 0 });
    expect(runner.missedExecutionTolerance).toBe(0);
  });

  it('starts running',  async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = createRunner(timeMatcher, 200);
    

    expect(runner.isStarted()).toBe(false)
    expect(runner.isStopped()).toBe(true)
    runner.start();
    expect(runner.isStarted()).toBe(true)
    expect(runner.isStopped()).toBe(false)

    await new Promise(resolve => { setTimeout(resolve, 1000)});
    runner.stop()
    expect(runner.runCount >= 1).toBe(true);

  });

  it('allows handle failed', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');

    const errorCaught = new Promise<any>((resolve) => {
      const runner =  new Runner(timeMatcher, async ()=> {
        throw new Error('fail!')
      }, {
        onError(date, error){
          resolve(error);
          runner.stop()
        }
      });
      runner.start();
    });

    const result = await errorCaught;
    expect(result.message).toBe('fail!');
  });

  it('allows handle task finished', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');

    const resultCaught = new Promise<any>((resolve) => {
      const runner =  new Runner(timeMatcher, async ()=> {
        return 'task finished';
      }, {
        onFinished(date, execution){
          resolve(execution.result);
          runner.stop();
          return true;
        }
      });
      runner.start();
    });

    const result = await resultCaught;
    expect(result).toBe('task finished');
  });

  it('allows handle before execute', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');

    const resultCaught = new Promise<any>((resolve) => {
      const runner =  new Runner(timeMatcher, async ()=> {
        return 'task finished';
      }, {
        async beforeRun(){
          return true;
        },
        onFinished(date, execution){
          resolve(execution.result);
          runner.stop();
          return true;
        }
      });
      runner.start();
    });

    const result = await resultCaught;
    expect(result).toBe('task finished');
  });

  it('allows manual execution', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');

    const resultCaught = new Promise<any>((resolve) => {
      const runner =  new Runner(timeMatcher, async ()=> {
        return 'task finished';
      }, {
        async beforeRun(){
          return true;
        },
        onFinished(date, execution){
          resolve(execution.result);
          runner.stop();
          return true;
        }
      });
      runner.execute();
    });

    const result = await resultCaught;
    expect(result).toBe('task finished');
  });

  it('allows handle task error on manual execution', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');

    const errorCaught = new Promise<Error>((resolve) => {
      const runner =  new Runner(timeMatcher, async ()=> {
        throw new Error('task failed');
      }, {
        onError(date, err){
          resolve(err);
          runner.stop();
        }
      });
      runner.execute();
    });

    const error = await errorCaught;
    expect(error.message).toBe('task failed')
  });

  it('before execute prevents run', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let boforeCalled = false;

    const runner =  new Runner(timeMatcher, async ()=> {
      return 'task finished';
    }, {
      beforeRun(){
        boforeCalled = true;
        return false;
      }
    });
    runner.start();
    await new Promise(resolve => { setTimeout(resolve, 1000)});
    runner.stop();
    expect(boforeCalled).toBe(true);
    expect(runner.runCount).toBe(0)
  });

  it('allows handle task error', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');

    const errorCaught = new Promise<Error>((resolve) => {
      const runner =  new Runner(timeMatcher, async ()=> {
        throw new Error('task failed');
      }, {
        onError(date, err){
          resolve(err);
          runner.stop();
        }
      });
      runner.start();
    });

    const error = await errorCaught;
    expect(error.message).toBe('task failed')
  });

  it('does not break if onError was not set',  async function(){
    const preError = logger.error;
    new Promise<Error>(resolve => {
      const timeMatcher = new TimeMatcher('* * * * * *');
      const runner =  new Runner(timeMatcher, async ()=> {
        throw new Error('task failed');
      });

      logger.error = (err: Error) => {
        resolve(err);
        runner.stop();
        logger.error = preError;
      }
      runner.start();
    });
  });

  it('returns next run',  async function(){
    const timeMatcher = new TimeMatcher('* * * * *');
    const runner = createRunner(timeMatcher, 200);
    
    const now = new Date();
    runner.start();

    const nextRun = runner.nextRun();
    // The next run is the next minute boundary: seconds/ms zeroed, and within
    // one minute of now. (Asserting `getMinutes() + 1` breaks at the :59 -> :00
    // rollover, where the next minute is 0, not 60.)
    expect(nextRun.getSeconds()).toBe(0);
    expect(nextRun.getMilliseconds()).toBe(0);
    const diff = nextRun.getTime() - now.getTime();
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThanOrEqual(60000);

    runner.stop()

  });

  it('prevents overlap', function(){
    return new Promise<void>((resolve, reject) => {
      const timeMatcher = new TimeMatcher('* * * * * *');

      const onOverlap = (date: Date) => {
        try{
          runner.stop();
          expect(date).toBeDefined();
          expect(runner.runCount).toBe(1);
          resolve();
        } catch(error){
          reject(error);
        }
      }

      const runner = createRunner(timeMatcher, 1200, { noOverlap: true, onOverlap: onOverlap });
      runner.start();
    });
  });

  it('prevents overlap without setting an onOverlap function', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner  = createRunner(timeMatcher, 1500, { noOverlap: true });
    runner.start();
    await new Promise(resolve => { setTimeout(resolve, 2000)});

    expect(runner.runCount).toBe(1);

    runner.stop();
  });

  it('when prevents overlap function failing', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = createRunner(timeMatcher, 1200, { noOverlap: true, onOverlap: ()=> { throw new Error('fail!')} });
    runner.start();
    await new Promise(resolve => { setTimeout(resolve, 2000)});
    runner.stop();

  });


  it('detects blocking IO', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let missedDate: Date | null = null;
    let missedCount = 0;

    const onMissedExecution = (date: Date) => { missedDate = date; missedCount++ };
    
    const runner = createRunner(timeMatcher, 200, { onMissedExecution: onMissedExecution });
    
    runner.start();

    await new Promise(resolve => { setTimeout(resolve, 1000)});
    blockIO(2000);
    await new Promise(resolve => { setTimeout(resolve, 1200)});

    runner.stop()
    expect(missedDate).not.toBeNull();
    expect(missedCount).toBe(1)

  });

  it('clears jitter timeout on stop', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let taskCalled = false;
    const origRandom = Math.random;
    // Force a long jitter delay so stop() is called while it's pending
    Math.random = () => 0.999;

    const runner = new Runner(timeMatcher, async () => {
      taskCalled = true;
    }, { maxRandomDelay: 30000 });

    runner.start();

    // Wait for heartbeat to fire and start the jitter delay (~29970ms)
    await new Promise(resolve => { setTimeout(resolve, 1500) });
    runner.stop();
    Math.random = origRandom;

    // Wait to confirm the jitter timeout was actually cleared
    await new Promise(resolve => { setTimeout(resolve, 2000) });

    expect(taskCalled).toBe(false);
  });

  it('sets a max delay on heartbeat', function(){
    const timeMatcher = new TimeMatcher('0 0 1 1 *');
    const runner = createRunner(timeMatcher, 1000);
    runner.start();

    const timeout: any = runner.heartBeatTimeout;
    
    expect(timeout._idleTimeout).toBe(86400000);

    runner.stop();
  });

  it('does not hang when beforeRun throws', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let errorCaught = false;

    const runner = new Runner(timeMatcher, async () => {
      return 'should not reach';
    }, {
      beforeRun() {
        throw new Error('beforeRun failed');
      },
      onError() {
        errorCaught = true;
      }
    });

    runner.start();
    await new Promise(resolve => { setTimeout(resolve, 2000) });
    runner.stop();

    // The runner should still be scheduling heartbeats (not stuck on a
    // permanently pending promise). With noOverlap this would previously
    // block all future executions.
    expect(errorCaught).toBe(true);
  });

  it('reports beforeRun errors via onError', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let caughtMessage = '';

    const errorSeen = new Promise<void>((resolve) => {
      const runner = new Runner(timeMatcher, async () => {
        return 'should not reach';
      }, {
        beforeRun() {
          throw new Error('beforeRun exploded');
        },
        onError(date, err) {
          caughtMessage = err.message;
          runner.stop();
          resolve();
        }
      });
      runner.start();
    });

    await errorSeen;
    expect(caughtMessage).toBe('beforeRun exploded');
  });

  it('does not hang jitter promise when onError throws', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    const origRandom = Math.random;
    Math.random = () => 0.5;
    let onErrorCallCount = 0;

    const runner = new Runner(timeMatcher, async () => {
      throw new Error('task boom');
    }, {
      maxRandomDelay: 200,
      noOverlap: true,
      onError() {
        onErrorCallCount++;
        throw new Error('onError also throws');
      }
    });

    runner.start();
    await new Promise(resolve => { setTimeout(resolve, 4000) });
    Math.random = origRandom;
    runner.stop();

    expect(onErrorCallCount).toBeGreaterThan(1);
  });

  it('does not emit unhandled rejection when task throws', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let unhandled = false;

    const handler = () => { unhandled = true; };
    process.on('unhandledRejection', handler);

    const errorSeen = new Promise<void>((resolve) => {
      const runner = new Runner(timeMatcher, async () => {
        throw new Error('task boom');
      }, {
        onError() {
          runner.stop();
          resolve();
        }
      });
      runner.start();
    });

    await errorSeen;
    // Give the event loop a tick for any unhandled rejection to surface.
    await new Promise(resolve => setTimeout(resolve, 50));
    process.removeListener('unhandledRejection', handler);

    expect(unhandled).toBe(false);
  });

  it('execute skips the task when beforeRun returns false', async function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    let taskCalled = false;

    const runner = new Runner(timeMatcher, async () => {
      taskCalled = true;
    }, {
      beforeRun() { return false; }
    });

    await runner.execute();
    expect(taskCalled).toBe(false);
    expect(runner.runCount).toBe(0);
  });

  it('skips execution when coordinator declines (not elected)', async function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    let skipReason: string | undefined;

    const coordinator = {
      async shouldRun() { return false; },
      async onComplete() {},
    };

    const runner = new Runner(timeMatcher, async () => {}, {
      runCoordinator: coordinator,
      coordinatorKeyPrefix: 'test',
      onSkipped(date, reason) { skipReason = reason; },
    });

    runner.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    runner.stop();

    expect(skipReason).toBe('not-elected');
    expect(runner.runCount).toBe(0);
  });

  it('skips execution when coordinator throws (fail-closed)', async function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    let skipReason: string | undefined;

    const coordinator = {
      async shouldRun() { throw new Error('redis down'); },
      async onComplete() {},
    };

    const runner = new Runner(timeMatcher, async () => {}, {
      runCoordinator: coordinator,
      coordinatorKeyPrefix: 'test',
      onSkipped(date, reason) { skipReason = reason; },
    });

    runner.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    runner.stop();

    expect(skipReason).toBe('coordinator-error');
    expect(runner.runCount).toBe(0);
  });

  it('uses default no-op onSkipped when coordinator declines', async function () {
    const timeMatcher = new TimeMatcher('* * * * * *');

    const coordinator = {
      async shouldRun() { return false; },
      async onComplete() {},
    };

    const runner = new Runner(timeMatcher, async () => {}, {
      runCoordinator: coordinator,
      coordinatorKeyPrefix: 'test',
    });

    runner.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    runner.stop();

    expect(runner.runCount).toBe(0);
  });

  it('runs coordinator onComplete after task finishes', async function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    let completedKey: string | undefined;

    const coordinator = {
      async shouldRun() { return true; },
      async onComplete(key: string) { completedKey = key; },
    };

    const runner = new Runner(timeMatcher, async () => 'done', {
      runCoordinator: coordinator,
      coordinatorKeyPrefix: 'test',
    });

    runner.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    runner.stop();

    expect(completedKey).toBeDefined();
    expect(completedKey).toMatch(/^test:/);
  });

  it('catches rejection when beforeRun and onError both throw', async function () {
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async () => {}, {
      beforeRun: () => { throw new Error('beforeRun failed'); },
      onError: () => { throw new Error('onError also failed'); },
    });
    runner.start();

    await new Promise(resolve => setTimeout(resolve, 1200));
    runner.stop();
  });
});

function blockIO(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms);
}

function createRunner(timeMatcher: TimeMatcher, delay: number, options?: RunnerOptions){
  return new Runner(timeMatcher, async ()=> {
    await new Promise(resolve => { setTimeout(resolve, delay)});
  }, options);
}