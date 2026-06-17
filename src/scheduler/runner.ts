import { createID } from "../create-id";
import logger, { Logger } from "../logger";
import { TrackedPromise } from "../promise/tracked-promise";
import { Execution } from "../tasks/scheduled-task";
import { TimeMatcher } from "../time/time-matcher";
import { planBeat } from "./plan-beat";

/**
 * How late, in milliseconds, a heartbeat may wake and still run the slot it was
 * armed for instead of reporting it missed. Long setTimeout delays drift, so a
 * small grace keeps daily/weekly schedules from being skipped. Always bounded
 * by the gap to the next slot (see planBeat).
 */
const DEFAULT_MISSED_EXECUTION_TOLERANCE = 1000;

type OnFn = (date: Date) => void | Promise<void>;
type OnErrorHookFn = (date: Date, error: Error, execution: Execution) => void | Promise<void>;
type OnErrorFn = (date: Date, error: Error) => void | Promise<void>;
type OnHookFn = (date: Date, execution: Execution) => boolean | Promise<boolean>;

type OnMatch = (date: Date, execution: Execution) => any | Promise<any>;

function emptyOnFn(){};
function emptyHookFn(){ return true };

export type RunnerOptions = {
  noOverlap?: boolean,
  timezone?: string,
  maxExecutions?: number,
  maxRandomDelay?: number,
  missedExecutionTolerance?: number,
  logger?: Logger,
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
  missedExecutionTolerance: number;
  runCount: number;

  running: boolean;

  heartBeatTimeout?: NodeJS.Timeout;
  logger: Logger;
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
      this.missedExecutionTolerance = options?.missedExecutionTolerance ?? DEFAULT_MISSED_EXECUTION_TOLERANCE;
      this.logger = options?.logger || logger;

      this.onMissedExecution = options?.onMissedExecution || emptyOnFn;
      this.onOverlap = options?.onOverlap || emptyOnFn;

      this.onError = options?.onError || ((date: Date, error: Error) => this.logger.error('Task failed with error!', error));
      this.onFinished = options?.onFinished || emptyHookFn;
      this.beforeRun = options?.beforeRun || emptyHookFn;

      this.onMaxExecutions = options?.onMaxExecutions || emptyOnFn;

      this.runCount = 0;
      this.running = false;
  }

  private onErrorFallback = (date: Date, error: Error) => {
    this.logger.error('Task failed with error!', error);
  }

  start() {
    this.running = true;
    let lastExecution: TrackedPromise<any>;
    // The slot the current heartbeat is armed for.
    let expectedNextExecution: Date = this.timeMatcher.getNextMatch(nowWithoutMs());

    const armHeartBeat = () => {
      if (this.running) {
        clearTimeout(this.heartBeatTimeout);
        this.heartBeatTimeout = setTimeout(heartBeat, getDelay(expectedNextExecution));
      }
    };

    const runTask = (date: Date): Promise<any> => {
      return new Promise(async (resolve) => {
        const execution: Execution = {
          id: createID('exec'),
          reason: 'scheduled'
        }

        const shouldExecute = await this.beforeRun(date, execution);
        const randomDelay = Math.floor(Math.random() * this.maxRandomDelay);

        if(shouldExecute){
          // uses a setTimeout for aplying a jitter
          setTimeout(async () => {
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
          resolve(true);
        }
      })
    }

    const heartBeat = async () => {
      // ignore milliseconds so the comparison against the matched slot is exact.
      const currentDate = nowWithoutMs();

      const plan = planBeat(
        expectedNextExecution,
        currentDate,
        this.missedExecutionTolerance,
        (date: Date) => this.timeMatcher.getNextMatch(date)
      );

      expectedNextExecution = plan.next;

      // Report every superseded slot. The "missed execution" warning is emitted
      // by the task's onMissedExecution handler so it can honour listener-based
      // and explicit suppression and use the task's logger.
      for (const missedSlot of plan.missed) {
        runAsync(this.onMissedExecution, missedSlot, this.onErrorFallback);
      }

      if (plan.run) {
        // overlap prevention
        if (lastExecution && lastExecution.getState() === 'pending') {
          runAsync(this.onOverlap, plan.run, this.onErrorFallback);
          if (this.noOverlap) {
            this.logger.warn('task still running, new execution blocked by overlap prevention!');
            armHeartBeat();
            return;
          }
        }

        const slot = plan.run;
        lastExecution = new TrackedPromise(async (resolve, reject) => {
          try {
            await runTask(slot);
            resolve(true);
          } catch (err) {
            reject(err);
          }
        });
      }

      armHeartBeat();
    }

    armHeartBeat();
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

function getDelay(nextRun: Date) {
  const maxDelay = 86400000;
  // must use now for calculating the delay, it avoids milliseconds addition to the timeout.
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