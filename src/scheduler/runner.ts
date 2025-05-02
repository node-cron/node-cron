import logger from "src/logger";
import { TrackedPromise } from "src/promise/tracked-promise";
import { MatcherWalker } from "src/time/matcher-walker";
import { TimeMatcher } from "src/time/time-matcher";

type RunnerOptions = {
  noOverlap?: boolean,
  timezone?: string
}

export class Runner {
  timeMatcher: TimeMatcher;
  onMacth: Function;
  noOverlap: boolean;

  heartBeatTimeout?: NodeJS.Timeout;

  constructor(timeMatcher: TimeMatcher, onMacth: Function, options?: RunnerOptions){
      this.timeMatcher = timeMatcher;
      this.onMacth = onMacth;
      this.noOverlap = options == undefined || options.noOverlap === undefined ? false : options.noOverlap;
  }

  start() {
    let lastExecution: TrackedPromise<any>;
    let expectedNextExecution: Date;

    const heartBeat = async () => {
      const currentDate = new Date();
      currentDate.setMilliseconds(0);

      if(expectedNextExecution && expectedNextExecution.getTime() < currentDate.getTime()){
        while(expectedNextExecution.getTime() < currentDate.getTime()){
          logger.warn(`missed execution at ${expectedNextExecution}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
          expectedNextExecution = this.timeMatcher.getNextMatch(expectedNextExecution);
        }
        expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);
        this.heartBeatTimeout = setTimeout(heartBeat, getDelay(this.timeMatcher, currentDate));
        return;
      }

      // overlap prevention
      if(this.noOverlap && lastExecution && lastExecution.getState() === 'pending'){
        logger.warn('task still running, new execution blocked by overlap prevention!');
        expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);
        this.heartBeatTimeout = setTimeout(heartBeat, getDelay(this.timeMatcher, currentDate));
        return;
      }

      // execute the task
      lastExecution = checkAndRun(this.timeMatcher, currentDate, this.onMacth);

      expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);

      // schedule the next run
      this.heartBeatTimeout = setTimeout(heartBeat, getDelay(this.timeMatcher, currentDate));
    }
    
    this.heartBeatTimeout = setTimeout(()=>{
      heartBeat();
    }, 0);
  }

  nextRun(){
    return this.timeMatcher.getNextMatch(new Date());
  }

  stop(){
    if(this.heartBeatTimeout) clearTimeout(this.heartBeatTimeout);
  }
  
  isStarted(){
    return !!this.heartBeatTimeout;
  }

  isStopped(){
    return !this.isStarted();
  }
}

function checkAndRun(timeMatcher: TimeMatcher, date: Date, onMacth: Function): TrackedPromise<any> {
  return new TrackedPromise(async (resolve, reject) => {
    try {
      if(timeMatcher.match(new Date())){
        await onMacth();
      }
      resolve(true);
    } catch (error){
      reject(error);
    }
  });
}

function getDelay(timeMatcher: TimeMatcher, currentDate: Date) {
  const nextRun = timeMatcher.getNextMatch(currentDate);
  return nextRun.getTime() - currentDate.getTime();
}