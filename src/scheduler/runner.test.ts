import {assert} from 'chai';
import { Runner } from './runner';
import { TimeMatcher } from 'src/time/time-matcher';

describe('scheduler/runner', function(){
  it('runs',  async function(){
    const timeMatcher = new TimeMatcher('10 * * * *');
    const runner = new Runner(timeMatcher, async ()=> {
      console.log(new Date());
      await new Promise(resolve => { setTimeout(resolve, 500)});
      
    }, { noOverlap: true });
    
    runner.start();

    console.log(runner.nextRun());
    
    // await new Promise(resolve => { setTimeout(resolve, 2000)});
    // simulateBlockingIO(3000);
    await new Promise(resolve => { setTimeout(resolve, 6000)});
    
  }).timeout(10000);
});

function simulateBlockingIO(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms) {
  }
}