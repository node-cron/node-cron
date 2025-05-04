import {assert} from 'chai';
import { Runner, RunnerOptions } from './runner';
import { TimeMatcher } from 'src/time/time-matcher';
import { Execution } from 'src/tasks/scheduled-task';

import logger from 'src/logger';

describe('scheduler/runner', function(){
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
    logger.info('TESTE 123')
    assert.isTrue(runner.runCount >= 2);

  }).timeout(3000);

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
  }).timeout(3000);

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
  }).timeout(3000);

  it('before execute prevents run', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let boforeCalled = false;

    const runner =  new Runner(timeMatcher, async ()=> {
      return 'task finished';
    }, {
      beforeRun(date: Date){
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
  }).timeout(3000);

  it('does not break if onError was not set',  async function(){
    const preError = logger.error;
    const errorCaught = new Promise<Error>(resolve => {
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
  }).timeout(3000);

  it('returns next run',  async function(){
    const timeMatcher = new TimeMatcher('* * * * *');
    const runner = createRunner(timeMatcher, 200);
    
    const now = new Date();
    runner.start();

    const nextRun = runner.nextRun();
    assert.equal(nextRun.getMinutes(), now.getMinutes() + 1);

    runner.stop()

  }).timeout(3000);

  it('prevents overlap', function(done){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let runner: Runner;

    const onOverlap = (date: Date) => {
      try{
        runner.stop();
        assert.isDefined(date);
        assert.equal(runner.runCount, 1);
        done();
      } catch(error){
        done(error);
      }
    }

    runner = createRunner(timeMatcher, 1200, { noOverlap: true, onOverlap: onOverlap });
    runner.start();

  }).timeout(5000);

  it('prevents overlap without setting an onOverlap function', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let runner: Runner;

    runner = createRunner(timeMatcher, 1500, { noOverlap: true });
    runner.start();
    await new Promise(resolve => { setTimeout(resolve, 2000)});

    assert.equal(runner.runCount, 2);

    runner.stop();
  }).timeout(5000);

  it('when prevents overlap function failing', async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    let runner: Runner;

    runner = createRunner(timeMatcher, 1200, { noOverlap: true, onOverlap: ()=> { throw new Error('fail!')} });
    runner.start();
    await new Promise(resolve => { setTimeout(resolve, 2000)});
    runner.stop();

  }).timeout(5000);


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

  }).timeout(10000);
});

function blockIO(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms) {
  }
}

function createRunner(timeMatcher: TimeMatcher, delay: number, options?: RunnerOptions){
  return new Runner(timeMatcher, async ()=> {
    await new Promise(resolve => { setTimeout(resolve, delay)});
  }, options);
}