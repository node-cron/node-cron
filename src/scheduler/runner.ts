import { createID } from "../create-id";
import logger from "../logger";
import { TrackedPromise } from "../promise/tracked-promise";
import { Execution } from "../tasks/scheduled-task";
import { TimeMatcher } from "../time/time-matcher";

type OnFn = (date: Date) => void | Promise<void>;
type OnErrorHookFn = (date: Date, error: Error, execution: Execution) => void | Promise<void>;
type OnErrorFn = (date: Date, error: Error) => void | Promise<void>;
type OnHookFn = (date: Date, execution: Execution) => boolean | Promise<boolean>;

type OnMatch = (date: Date, execution: Execution) => any | Promise<any>;

function emptyOnFn(){};
function emptyHookFn(){ return true };

function defaultOnError(date: Date, error: Error){
  logger.error('Task failed with error!', error);
}

export type RunnerOptions = {
  noOverlap?: boolean,
  timezone?: string,
  onMissedExecution?: OnFn,
  onOverlap?: OnFn,
  onError?: OnErrorHookFn
  onFinished?: OnHookFn;
  beforeRun?: OnHookFn
}

export class Runner {
  timeMatcher: TimeMatcher;
  onMatch: OnMatch;
  noOverlap: boolean;
  runCount: number;

  running: boolean;

  heartBeatTimeout?: NodeJS.Timeout;
  onMissedExecution: OnFn;
  onOverlap: OnFn;
  onError: OnErrorHookFn;
  beforeRun: OnHookFn;
  onFinished: OnHookFn;

  constructor(timeMatcher: TimeMatcher, onMatch: OnMatch, options?: RunnerOptions){
      this.timeMatcher = timeMatcher;
      this.onMatch = onMatch;
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
      return new TrackedPromise(async (resolve) => {
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
              const result = await this.onMatch(date, execution);
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
        }
      });
    }

    const heartBeat = async () => {
      // get next is ignoring millisecond setting to zero to get a closer time here.
      const currentDate = nowWithoutMs()

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
    }, getDelay(this.timeMatcher, nowWithoutMs()));
  }

  nextRun(){
    return this.timeMatcher.getNextMatch(new Date());
  }

  stop(){
    this.running = false;
    if(this.heartBeatTimeout) {
      clearTimeout(this.heartBeatTimeout);
      this.heartBeatTimeout = undefined;
    }
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
        const result = await this.onMatch(date, execution);
        execution.finishedAt = new Date();
        execution.result = result;
        this.onFinished(date, execution);
      }
    } catch (error: any){
      execution.finishedAt = new Date();
      execution.error = error;
      this.onError(date, error, execution);
    }
  }
}

async function runAsync(fn: OnFn, date: Date, onError: OnErrorFn){
  try {
    await fn(date);
  }catch (error: any) {
    onError(date, error);
  }
}

function getDelay(timeMatcher: TimeMatcher, currentDate: Date) {
  const nextRun = timeMatcher.getNextMatch(currentDate);
  // must use now for calculating the delay, it avoids miliseconds addition to the timeout.
  const now = new Date();
  const delay = nextRun.getTime() - now.getTime();
  return Math.max(0, delay);
}

function nowWithoutMs(): Date{
  const date = new Date();
  date.setMilliseconds(0);
  return date;
}