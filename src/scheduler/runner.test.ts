import {assert} from 'chai';
import { Runner } from './runner';
import { TimeMatcher } from 'src/time/time-matcher';

describe('scheduler/runner', function(){
  it('runs',  async function(){
    const timeMatcher = new TimeMatcher('* * * * * *');
    const runner = new Runner(timeMatcher, async ()=> {
      await new Promise(resolve => { setTimeout(resolve, 500)});
      console.log(new Date());
    }, { noOverlap: true });
    
    runner.start();
    
    await new Promise(resolve => { setTimeout(resolve, 2000)});
    simulateBlockingIO(3000);
    await new Promise(resolve => { setTimeout(resolve, 6000)});
    
  }).timeout(10000);
});

function simulateBlockingIO(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms) {
  }
}