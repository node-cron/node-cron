import { EnvVarRunCoordinator } from "./env-var-run-coordinator";

/**
 * Decides whether the current instance should run a given fire of a task with
 * `distributed: true`. The built-in default (EnvVarRunCoordinator) keys off an
 * env var so a single designated instance runs. For HA, per-fire coordination
 * across a fleet (e.g. a Redis lock), provide one via `setRunCoordinator`.
 */
export interface RunCoordinator {
  /**
   * Return `true` if THIS instance should run the fire identified by `key`,
   * `false` to skip it (another instance handles it). Throw to fail closed
   * (the run is skipped). `ttlMs` is a safety lease hint for lease-based
   * coordinators (a Redis lock uses it; config-based ones ignore it).
   */
  shouldRun(key: string, ttlMs: number): boolean | Promise<boolean>;
  /**
   * Called after the run completes (success or failure); e.g. release a lock.
   * Config-based coordinators leave it unimplemented.
   */
  onComplete?(key: string): void | Promise<void>;
}

/** Why a scheduled execution was skipped (carried on `execution:skipped`). */
export type SkipReason = 'not-elected' | 'coordinator-error';

let globalRunCoordinator: RunCoordinator | undefined;

/** Sets the process-wide run coordinator used by tasks scheduled with `distributed: true`. */
export function setRunCoordinator(coordinator: RunCoordinator | undefined): void {
  globalRunCoordinator = coordinator;
}

/**
 * Resolves the coordinator a distributed task uses: a per-task one wins, then
 * the global one, then the built-in env-var default. Constructing the default
 * validates the env eagerly, so a misconfiguration fails at schedule time
 * (startup) rather than silently at the first fire.
 */
export function resolveRunCoordinator(perTask?: RunCoordinator): RunCoordinator {
  return perTask ?? globalRunCoordinator ?? new EnvVarRunCoordinator();
}
