import { createID } from "../create-id";
import logger from "../logger";
import { TrackedPromise } from "../promise/tracked-promise";
import { Execution } from "../tasks/scheduled-task";
import { TimeMatcher } from "../time/time-matcher";

type OnFn = (date: Date) => void | Promise<void>;
type OnErrorFn = (date: Date, error: Error, execution: Execution) => void | Promise<void>;
type OnHookFn = (date: Date, execution: Execution) => boolean | Promise<boolean>;


function emptyOnFn(){};
function emptyHookFn(){ return true };

function defaultOnError(date, error){
  logger.error('Task failed with error!', error);
}

export type RunnerOptions = {
  noOverlap?: boolean,
  timezone?: string,
  onMissedExecution?: OnFn,
  onOverlap?: OnFn,
  onError?: OnErrorFn
  onFinished?: OnHookFn;
  beforeRun?: OnHookFn
}

export class Runner {
  timeMatcher: TimeMatcher;
  onMacth: Function;
  noOverlap: boolean;
  runCount: number;

  running: boolean;

  heartBeatTimeout?: NodeJS.Timeout;
  onMissedExecution: OnFn;
  onOverlap: OnFn;
  onError: OnErrorFn;
  beforeRun: OnHookFn;
  onFinished: OnHookFn;

  constructor(timeMatcher: TimeMatcher, onMacth: Function, options?: RunnerOptions){
      this.timeMatcher = timeMatcher;
      this.onMacth = onMacth;
      this.noOverlap = options == undefined || options.noOverlap === undefined ? false : options.noOverlap;

      this.onMissedExecution = options?.onMissedExecution || emptyOnFn;
      this.onOverlap = options?.onOverlap || emptyOnFn;

      this.onError = options?.onError || defaultOnError;
      this.onFinished = options?.onFinished || emptyHookFn;
      this.beforeRun = options?.beforeRun || emptyHookFn;

      this.runCount = 0;
      this.running = false;
  }
  
  start() {
    this.running = true;
    let lastExecution: TrackedPromise<any>;
    let expectedNextExecution: Date;

    const scheduleNextHeartBeat = (currentDate: Date) => {
      if (this.running) {
          clearTimeout(this.heartBeatTimeout);
          this.heartBeatTimeout = setTimeout(heartBeat, getDelay(this.timeMatcher, currentDate));
      }
    };

    const checkAndRun = (date: Date): TrackedPromise<any> => {
      return new TrackedPromise(async (resolve, reject) => {
        const execution: Execution = {
          id: createID('exec'),
          reason: 'scheduled'
        }
        try {
          if(this.timeMatcher.match(date)){
            const shouldExecute = await this.beforeRun(date, execution);
            if(shouldExecute){
              this.runCount++;
              execution.startedAt = new Date();
              const result = await this.onMacth();
              execution.finishedAt = new Date();
              execution.result = result;
              this.onFinished(date, execution);
              }
          }
          resolve(true);
        } catch (error: any){
          execution.finishedAt = new Date();
          execution.error = error;
          this.onError(date, error, execution);
          reject(error);
        }
      });
    }

    const heartBeat = async () => {
      const currentDate = new Date();
      // get next is ignoring millisecond setting to zero to get a closer time here.
      currentDate.setMilliseconds(0);

      // blocking IO detection
      if(expectedNextExecution && expectedNextExecution.getTime() < currentDate.getTime()){
        while(expectedNextExecution.getTime() < currentDate.getTime()){
          logger.warn(`missed execution at ${expectedNextExecution}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
          expectedNextExecution = this.timeMatcher.getNextMatch(expectedNextExecution);
          runAsync(this.onMissedExecution, expectedNextExecution, defaultOnError);
        }
        // expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);
        // return;
      }

      // overlap prevention
      if(lastExecution && lastExecution.getState() === 'pending'){
        runAsync(this.onOverlap, currentDate, defaultOnError);
        if(this.noOverlap){
          logger.warn('task still running, new execution blocked by overlap prevention!');
          expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);
          scheduleNextHeartBeat(currentDate);
          return;
        }
      }

      // execute the task
      lastExecution = checkAndRun(currentDate);

      expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);

      // schedule the next run
      scheduleNextHeartBeat(currentDate);
    }
    
    this.heartBeatTimeout = setTimeout(()=>{
      heartBeat();
    }, 0);
  }

  nextRun(){
    return this.timeMatcher.getNextMatch(new Date());
  }

  stop(){
    this.running = false;
    if(this.heartBeatTimeout) clearTimeout(this.heartBeatTimeout);
  }
  
  isStarted(){
    return !!this.heartBeatTimeout && this.running;
  }

  isStopped(){
    return !this.isStarted();
  }

  async execute(){
    const date = new Date();
    const execution: Execution = {
      id: createID('exec'),
      reason: 'invoked'
    }
    try {
      const shouldExecute = await this.beforeRun(date, execution);
      if(shouldExecute){
        this.runCount++;
        execution.startedAt = new Date();
        const result = await this.onMacth();
        execution.finishedAt = new Date();
        execution.result = result;
        this.onFinished(date, execution);
      }
    } catch (error: any){
      execution.finishedAt = new Date();
      execution.error = error;
      this.onError(date, error, execution);
      throw error;
    }
  }
}

async function runAsync(fn: OnFn, date: Date, onError){
  try {
    await fn(date);
  }catch (error) {
    onError(error);
  }
}

function getDelay(timeMatcher: TimeMatcher, currentDate: Date) {
  const nextRun = timeMatcher.getNextMatch(currentDate);
  // must use now for calculating the delay, it avoids miliseconds addition to the timeout.
  const now = new Date();
  return nextRun.getTime() - now.getTime();
}