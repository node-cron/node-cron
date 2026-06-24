import {assert} from 'chai';
import { Runner, RunnerOptions } from './runner';
import { TimeMatcher } from '../time/time-matcher';

import logger from '../logger';

describe('scheduler/runner', function(){
  it('defaults the missed-execution tolerance to 1000ms', function(){
    const runner = createRunner(new TimeMatcher('* * * * * *'), 200);
    assert.equal(runner.missedExecutionTolerance, 1000);
  });

  it('honours a custom missed-execution tolerance', function(){
    const runner = createRunner(new TimeMatcher('* * * * * *'), 200, { missedExecutionTolerance: 0 });
    assert.equal(runner.missedExecutionTolerance, 0);
  });

  it('starts running',  async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = createRunner(timeMatcher, 200);
    

    assert.isFalse(runner.isStarted())
    assert.isTrue(runner.isStopped())
    runner.start();
    assert.isTrue(runner.isStarted())
    assert.isFalse(runner.isStopped())

    await new Promise(resolve => { setTimeout(resolve, 1000)});
    runner.stop()
    assert.isTrue(runner.runCount >= 1);

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
    assert.equal(result.message, 'fail!');
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
    assert.equal(result, 'task finished');
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
    assert.equal(result, 'task finished');
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
    assert.equal(result, 'task finished');
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
    assert.equal(error.message, 'task failed')
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
    assert.isTrue(boforeCalled);
    assert.equal(runner.runCount, 0)
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
    assert.equal(error.message, 'task failed')
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
    assert.equal(nextRun.getSeconds(), 0);
    assert.equal(nextRun.getMilliseconds(), 0);
    const diff = nextRun.getTime() - now.getTime();
    assert.isAbove(diff, 0);
    assert.isAtMost(diff, 60000);

    runner.stop()

  });

  it('prevents overlap', function(){
    return new Promise<void>((resolve, reject) => {
      const timeMatcher = new TimeMatcher('* * * * * *');

      const onOverlap = (date: Date) => {
        try{
          runner.stop();
          assert.isDefined(date);
          assert.equal(runner.runCount, 1);
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

    assert.equal(runner.runCount, 1);

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
    assert.isNotNull(missedDate);
    assert.equal(missedCount, 1)

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

    assert.isFalse(taskCalled, 'task should not run after stop() cancels the jitter timeout');
  });

  it('sets a max delay on heartbeat', function(){
    const timeMatcher = new TimeMatcher('0 0 1 1 *');
    const runner = createRunner(timeMatcher, 1000);
    runner.start();

    const timeout: any = runner.heartBeatTimeout;
    
    assert.equal(timeout._idleTimeout, 86400000);

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