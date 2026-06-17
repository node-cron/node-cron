/**
 * A distributed lock backend. Provide one via `setLockProvider` to make
 * `lock: true` tasks run on a single instance per fire across a fleet (e.g. a
 * Redis-backed implementation). node-cron ships no default: the guarantee only
 * holds with a real shared backend.
 */
export interface LockProvider {
  /**
   * Try to acquire the lock for `key`. Resolves `true` if acquired, `false` if
   * already held. `ttlMs` is a safety expiry in case the holder crashes without
   * releasing.
   */
  acquire(key: string, ttlMs: number): Promise<boolean>;
  /** Release a previously acquired lock. */
  release(key: string): Promise<void>;
}

let globalLockProvider: LockProvider | undefined;

/** Sets the process-wide lock provider used by tasks scheduled with `lock: true`. */
export function setLockProvider(provider: LockProvider | undefined): void {
  globalLockProvider = provider;
}

/** Returns the configured lock provider, or `undefined` when none is set. */
export function getLockProvider(): LockProvider | undefined {
  return globalLockProvider;
}
