import { createID } from "../create-id";
import logger, { Logger } from "../logger";
import { TrackedPromise } from "../promise/tracked-promise";
import { Execution } from "../tasks/scheduled-task";
import { TimeMatcher } from "../time/time-matcher";
import { planBeat } from "./plan-beat";
import { RunCoordinator, SkipReason } from "../coordinator/run-coordinator";

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
type OnSkippedFn = (date: Date, reason: SkipReason) => void | Promise<void>;

type OnMatch = (date: Date, execution: Execution) => any | Promise<any>;

function emptyOnFn(){};
function emptySkipFn(){};
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
  // Distributed run coordination (one instance per fire across a fleet). Active
  // only when a coordinator is set; the key is `${coordinatorKeyPrefix}:${fireTime}`.
  runCoordinator?: RunCoordinator
  coordinatorKeyPrefix?: string
  coordinatorTtl?: number
  onSkipped?: OnSkippedFn
}

const DEFAULT_COORDINATOR_TTL = 30000;

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
  private jitterTimeout?: NodeJS.Timeout;
  logger: Logger;
  onMissedExecution: OnFn;
  onOverlap: OnFn;
  onError: OnErrorHookFn;
  beforeRun: OnHookFn;
  onFinished: OnHookFn;
  onMaxExecutions: OnFn;

  runCoordinator?: RunCoordinator;
  coordinatorKeyPrefix: string;
  coordinatorTtl: number;
  onSkipped: OnSkippedFn;

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

      this.runCoordinator = options?.runCoordinator;
      this.coordinatorKeyPrefix = options?.coordinatorKeyPrefix || '';
      this.coordinatorTtl = options?.coordinatorTtl ?? DEFAULT_COORDINATOR_TTL;
      this.onSkipped = options?.onSkipped || emptySkipFn;

      this.runCount = 0;
      this.running = false;
  }

  private onErrorFallback = (date: Date, error: Error) => {
    this.logger.error('Task failed with error!', error);
  }

  /**
   * Runs `run` under the run coordinator when one is configured. If the
   * coordinator declines this instance, the run is skipped and `onSkipped` is
   * emitted with `'not-elected'`. Fail-closed: if `shouldRun` throws, the run is
   * skipped with `'coordinator-error'`. `onComplete` runs after the task.
   */
  private async runCoordinated(slot: Date, run: () => Promise<any>): Promise<void> {
    if (!this.runCoordinator) {
      await run();
      return;
    }

    const key = `${this.coordinatorKeyPrefix}:${slot.toISOString()}`;
    let allowed: boolean;
    try {
      allowed = await this.runCoordinator.shouldRun(key, this.coordinatorTtl);
    } catch (err: any) {
      this.logger.error('Run coordinator failed; skipping execution (fail-closed)', err);
      this.emitSkipped(slot, 'coordinator-error');
      return;
    }

    if (!allowed) {
      this.emitSkipped(slot, 'not-elected');
      return;
    }

    try {
      await run();
    } finally {
      try {
        await this.runCoordinator.onComplete?.(key);
      } catch (err: any) {
        this.logger.error('Run coordinator onComplete failed', err);
      }
    }
  }

  private emitSkipped(slot: Date, reason: SkipReason){
    Promise.resolve(this.onSkipped(slot, reason)).catch((err) => this.onErrorFallback(slot, err));
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

    const runTask = async (date: Date): Promise<void> => {
      const execution: Execution = {
        id: createID(),
        reason: 'scheduled'
      }

      let shouldExecute: boolean;
      try {
        shouldExecute = await this.beforeRun(date, execution);
      } catch (error: any) {
        this.onError(date, error, execution);
        return;
      }

      if (!shouldExecute) return;

      const execute = async () => {
        try {
          this.runCount++;
          execution.startedAt = new Date();
          const result = await this.onMatch(date, execution);
          execution.finishedAt = new Date();
          execution.result = result;
          this.onFinished(date, execution);

          if (this.maxExecutions && this.runCount >= this.maxExecutions) {
            this.onMaxExecutions(date);
            this.stop();
          }
        } catch (error: any) {
          execution.finishedAt = new Date();
          execution.error = error;
          try {
            this.onError(date, error, execution);
          } catch (hookError: any) {
            this.onErrorFallback(date, hookError);
          }
        }
      };

      // The jitter timer only earns its macrotask hop when a random delay is
      // actually configured. With the default maxRandomDelay of 0 the delay
      // is always 0, so run inline and fire on the heartbeat's own tick
      // instead of bouncing through an extra setTimeout (which adds ~1ms+ of
      // avoidable drift to every execution).
      const randomDelay = Math.floor(Math.random() * this.maxRandomDelay);
      if (randomDelay > 0) {
        await new Promise<void>(resolve => {
          this.jitterTimeout = setTimeout(() => {
            execute().then(() => resolve(), () => resolve());
          }, randomDelay);
        });
      } else {
        await execute();
      }
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
            await this.runCoordinated(slot, () => runTask(slot));
            resolve(true);
          } catch (err) {
            reject(err);
          }
        });
        // Errors are already reported via onError; suppress the unhandled
        // rejection that would otherwise crash the process on Node 22+.
        lastExecution.catch(() => {});
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
    if(this.jitterTimeout) {
      clearTimeout(this.jitterTimeout);
      this.jitterTimeout = undefined;
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
      id: createID(),
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