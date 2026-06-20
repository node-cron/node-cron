import { Logger } from "../logger";
import { RunCoordinator, SkipReason } from "../coordinator/run-coordinator";

/**
 * Represents an event triggered by a cron job.
 *
 * @property date - The date and time when the event occurred.
 * @property missedCount - The number of executions that were missed prior to this event.
 * @property dateLocalIso - The ISO 8601 formatted local date and time of the event.
 * @property reason - The reason or context for the event.
 * @property task - (Optional) The scheduled task associated with this event.
 */
export type TaskContext = {
  date: Date;
  dateLocalIso: string;
  task?: ScheduledTask;
  execution?: Execution
  triggeredAt: Date;
  /** Why the execution was skipped. Present only on `execution:skipped`. */
  reason?: SkipReason;
}

export type TaskEvent =
  | 'task:started'
  | 'task:stopped'
  | 'task:destroyed'
  | 'execution:started'
  | 'execution:finished'
  | 'execution:failed'
  | 'execution:missed'
  | 'execution:overlap'
  | 'execution:maxReached'
  | 'execution:skipped'

export type TaskOptions = {
  timezone?: string,
  name?: string,
  noOverlap?: boolean,
  /**
   * Coordinate this task across a fleet so it runs on one instance per fire,
   * via the run coordinator. By default the coordinator keys off an env var
   * (`NODE_CRON_RUN`) for a single designated runner; provide one via
   * `setRunCoordinator` (or the per-task `runCoordinator`) for HA, per-fire
   * coordination (e.g. a Redis lock). Requires a `name` (the coordination key
   * is `name:fireTime`). Works for both inline and background tasks; for
   * background tasks the daemon coordinates with the parent over IPC. When an
   * instance is not elected to run, it emits `execution:skipped`.
   */
  distributed?: boolean,
  /**
   * Run coordinator for this task, overriding the process-wide one set via
   * `setRunCoordinator`. Only used when `distributed` is true.
   */
  runCoordinator?: RunCoordinator,
  /**
   * Safety lease (ms) passed to lease-based coordinators (e.g. a Redis lock),
   * in case the holder crashes without releasing. Must be larger than the
   * task's run time. Ignored by config-based coordinators. Defaults to 30000.
   */
  distributedLease?: number,
  /**
   * Stop the task after this many executions. Counted per instance: combined
   * with `distributed` and a per-fire coordinator (e.g. a Redis lock), each
   * instance counts only the fires it won, so the total across the fleet can
   * exceed this number. With the default single-runner coordinator it behaves
   * as expected (only the designated instance runs and counts).
   */
  maxExecutions?: number,
  maxRandomDelay?: number,
  /**
   * Custom logger for this task. Overrides the global logger set via
   * `setLogger`. Note: not supported for background tasks (it cannot cross
   * the process boundary); use `setLogger` for those.
   */
  logger?: Logger,
  /**
   * Called when a scheduled or invoked execution throws (synchronously or via
   * a rejected promise). Fires in addition to the `execution:failed` event,
   * not instead of it. Receives the error and the execution context. Errors
   * thrown by this callback are swallowed so they cannot crash the scheduler.
   * For background tasks it runs in the parent process (driven by the
   * forwarded `execution:failed` event), mirroring how `logger` is handled.
   */
  onError?: (error: Error, context: TaskContext) => void,
  /**
   * When true, suppresses the "missed execution" warning for this task.
   * The warning is also suppressed automatically when an `execution:missed`
   * listener is attached.
   */
  suppressMissedWarning?: boolean,
  /**
   * How late, in milliseconds, a scheduled execution may wake and still run
   * instead of being reported as missed. Long timers drift (OS sleep, GC,
   * throttling, clock skew), which on daily/weekly schedules can skip the run
   * entirely. The tolerance is always capped to the gap to the next execution,
   * so it can never run a slot twice. Defaults to 1000.
   */
  missedExecutionTolerance?: number,
  /**
   * Timeout in milliseconds for `execute()` on background tasks. When set,
   * `execute()` rejects with "Execution timeout exceeded" if the task has not
   * reported back in time. Defaults to no timeout (waits for the task to
   * finish or fail). Has no effect on inline tasks.
   */
  executeTimeout?: number,
  /**
   * Timeout in milliseconds for a background task's initial start handshake
   * (forking the daemon and importing the task file). If the task file is large
   * or transpiled on load, the default may be too short and `start()` rejects
   * with "Start operation timed out"; increase it in that case. Defaults to
   * 5000. Has no effect on inline tasks.
   */
  startTimeout?: number
}

export type Execution = {
  id: string,
  reason: 'invoked' | 'scheduled'
  startedAt?: Date,
  finishedAt?: Date,
  error?: Error,
  result?: any
}

export type TaskFn = (context: TaskContext) => any | Promise<any>;

/**
 * Represents a scheduled task that can be managed and executed.
 */
export interface ScheduledTask {
  id: string,
  name?: string,
  
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
  getStatus(): string;
  destroy(): void | Promise<void>;
  execute(): Promise<any>;
  getNextRun(): Date | null;

  /** The next `count` instants this task's expression matches, from now. */
  getNextRuns(count: number): Date[];
  /** Whether the given date matches this task's expression. */
  match(date: Date): boolean;
  /** Milliseconds until the next run, or `null` when the task is stopped. */
  msToNext(): number | null;
  /** Whether an execution is currently in progress. */
  isBusy(): boolean;
  /** Remaining executions when `maxExecutions` is set, otherwise `undefined`. */
  runsLeft(): number | undefined;
  /** The original cron expression. */
  getPattern(): string;

  on(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void
  off(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void
  once(event: TaskEvent, fun: (context: TaskContext) => Promise<void> | void): void 
}