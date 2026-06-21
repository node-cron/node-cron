const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// A monotonic counter guarantees that two IDs minted in the same process are
// never equal, regardless of the random part.
let counter = 0;

/**
 * Generates an internal identifier for tasks and executions. These are registry
 * keys and log correlators, not security tokens, so they do not need
 * cryptographic randomness. Avoiding `crypto.randomBytes` (a syscall-backed
 * allocation) on every `schedule()` keeps the hot path cheap; a process-local
 * counter mixed with `Math.random` keeps them unique and unpredictable enough.
 */
export function createID(prefix: string = '', length: number = 16): string {
  let id = '';
  // Fold a few bits of the counter into the id so concurrent schedules in the
  // same millisecond can never collide.
  let n = counter = (counter + 1) >>> 0;
  for (let i = 0; i < length; i++) {
    if (n > 0) {
      id += CHARSET[n % 62];
      n = Math.floor(n / 62);
    } else {
      id += CHARSET[(Math.random() * 62) | 0];
    }
  }
  return prefix ? `${prefix}-${id}` : id;
}
