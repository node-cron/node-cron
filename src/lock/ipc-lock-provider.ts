import { createID } from "../create-id";
import { LockProvider } from "./lock-provider";

/**
 * The subset of an IPC channel (a forked `process`) this bridge needs: send a
 * message and listen for replies.
 */
export type IpcChannel = {
  send?: (message: any) => void;
  on: (event: string, listener: (message: any) => void) => unknown;
};

type LockResult = { type: 'lock:result'; reqId: string; acquired: boolean; error?: string };

/**
 * A `LockProvider` used inside a background task's daemon (child process). The
 * real provider lives in the parent (set via `setLockProvider`) and cannot
 * cross the fork, so this bridge forwards `acquire`/`release` to the parent over
 * IPC and the parent runs the real provider. Cross-fleet coordination still
 * happens in the shared backend (e.g. Redis) held by each instance's parent;
 * this only bridges child to its own parent.
 */
export class IpcLockProvider implements LockProvider {
  private pending = new Map<string, (result: LockResult) => void>();

  constructor(private channel: IpcChannel) {
    this.channel.on('message', (message: any) => {
      if (message?.type !== 'lock:result') return;
      const resolve = this.pending.get(message.reqId);
      if (resolve) {
        this.pending.delete(message.reqId);
        resolve(message);
      }
    });
  }

  acquire(key: string, ttlMs: number): Promise<boolean> {
    const reqId = createID('lock');
    return new Promise<boolean>((resolve, reject) => {
      this.pending.set(reqId, (result) => {
        // The parent reports a provider error by replying with `error`; reject so
        // the runner fails closed (skips the run), mirroring the inline path.
        if (result.error) reject(new Error(result.error));
        else resolve(result.acquired);
      });
      this.channel.send?.({ type: 'lock:acquire', key, ttlMs, reqId });
    });
  }

  release(key: string): Promise<void> {
    this.channel.send?.({ type: 'lock:release', key });
    return Promise.resolve();
  }
}
