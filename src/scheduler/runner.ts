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
  maxExecutions?: number,
  randomDelay?: number,
  maxRandomDelay?: number,
  onMissedExecution?: OnFn,
  onOverlap?: OnFn,
  onError?: OnErrorHookFn
  onFinished?: OnHookFn;
  beforeRun?: OnHookFn
  onMaxExecutions?: OnFn
}

export class Runner {
  timeMatcher: TimeMatcher;
  onMatch: OnMatch;
  noOverlap: boolean;
  maxExecutions?: number;
  maxRandomDelay: number;
  randomDelay?: number;
  runCount: number;

  running: boolean;

  heartBeatTimeout?: NodeJS.Timeout;
  onMissedExecution: OnFn;
  onOverlap: OnFn;
  onError: OnErrorHookFn;
  beforeRun: OnHookFn;
  onFinished: OnHookFn;
  onMaxExecutions: OnFn;

  constructor(timeMatcher: TimeMatcher, onMatch: OnMatch, options?: RunnerOptions){
      this.timeMatcher = timeMatcher;
      this.onMatch = onMatch;
      this.noOverlap = options == undefined || options.noOverlap === undefined ? false : options.noOverlap;
      this.maxExecutions = options?.maxExecutions;
      this.maxRandomDelay = options?.maxRandomDelay || 0;

      this.onMissedExecution = options?.onMissedExecution || emptyOnFn;
      this.onOverlap = options?.onOverlap || emptyOnFn;

      this.onError = options?.onError || defaultOnError;
      this.onFinished = options?.onFinished || emptyHookFn;
      this.beforeRun = options?.beforeRun || emptyHookFn;

      this.onMaxExecutions = options?.onMaxExecutions || emptyOnFn;

      this.runCount = 0;
      this.running = false;
  }
  
  start() {
    this.running = true;
    let lastExecution: TrackedPromise<any>;
    let expectedNextExecution: Date;

    const scheduleNextHeartBeat = (currentDate: Date) => {
      if (this.running) {
          if (this.heartBeatTimeout) {
            clearTimeout(this.heartBeatTimeout);
            this.heartBeatTimeout = undefined;
          }
          this.heartBeatTimeout = setTimeout(heartBeat, getDelay(this.timeMatcher, currentDate));
      }
    };

    const runTask = (date: Date): Promise<any> => {
      return new Promise(async (resolve) => {
        const execution: Execution = {
          id: createID('exec'),
          reason: 'scheduled'
        }
        
        const shouldExecute = await this.beforeRun(date, execution);
        const randomDelay = this.randomDelay ?? Math.floor(Math.random() * this.maxRandomDelay);

        if(shouldExecute){
          // uses a setTimeout for aplying a jitter
          setTimeout(async () => {
            // Check if runner is still running to prevent execution after stop
            if (!this.running) {
              resolve(true);
              return;
            }
            
            try {
              this.runCount++;
              execution.startedAt = new Date();
              const result = await this.onMatch(date, execution);
              execution.finishedAt = new Date();
              execution.result = result;
              this.onFinished(date, execution);
  
              if( this.maxExecutions && this.runCount >= this.maxExecutions){
                this.onMaxExecutions(date);
                this.stop();
              }
            } catch (error: any){
              execution.finishedAt = new Date();
              execution.error = error;
              this.onError(date, error, execution);
            }

            resolve(true);
          }, randomDelay);
        } else {
          // Fix: Always resolve the Promise even when shouldExecute is false
          resolve(true);
        }
      })
    }

    const checkAndRun = (date: Date): TrackedPromise<any> => {
      return new TrackedPromise(async (resolve, reject) => {
      try {
        if(this.timeMatcher.match(date)){
          await runTask(date);
        }
        resolve(true);
       } catch(err) {
         reject(err)
       }
      });
    }

    const heartBeat = async () => {
      // get next is ignoring millisecond setting to zero to get a closer time here.
      const currentDate = nowWithoutMs()

      // blocking IO detection
      if(expectedNextExecution && expectedNextExecution.getTime() < currentDate.getTime()){
        let missedCount = 0;
        const maxMissedExecutions = 100; // Prevent infinite loop
        while(expectedNextExecution.getTime() < currentDate.getTime() && missedCount < maxMissedExecutions){
          logger.warn(`missed execution at ${expectedNextExecution}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
          const nextExecution = this.timeMatcher.getNextMatch(expectedNextExecution);
          // Additional safety check to prevent infinite loop if getNextMatch returns same date
          if (nextExecution.getTime() <= expectedNextExecution.getTime()) {
            logger.error('getNextMatch returned same or earlier date, breaking loop to prevent infinite execution');
            break;
          }
          expectedNextExecution = nextExecution;
          runAsync(this.onMissedExecution, expectedNextExecution, defaultOnError);
          missedCount++;
        }
        if (missedCount >= maxMissedExecutions) {
          logger.error(`Stopped processing missed executions after ${maxMissedExecutions} iterations to prevent infinite loop`);
        }
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
  const maxDelay = 86400000;
  const nextRun = timeMatcher.getNextMatch(currentDate);
  // must use now for calculating the delay, it avoids miliseconds addition to the timeout.
  const now = new Date();
  const delay = nextRun.getTime() - now.getTime();

  // If the calculated delay exceeds the safe range for setTimeout (max ~24.85 days),
  // it may trigger a TimeoutOverflowWarning and fallback to a delay of 1 ms.
  // To avoid this, we cap the delay to 1 day (86,400,000 ms), which ensures a daily heartbeat.
  // This allows the time checker to re-evaluate pending executions and reschedule accordingly.
  if (delay > maxDelay) {
    return maxDelay;
  }

  return Math.max(0, delay);
}

function nowWithoutMs(): Date{
  const date = new Date();
  date.setMilliseconds(0);
  return date;
}