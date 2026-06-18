import { createID } from "../create-id";
import { RunCoordinator } from "./run-coordinator";

/**
 * The subset of an IPC channel (a forked `process`) this bridge needs: send a
 * message and listen for replies.
 */
export type IpcChannel = {
  send?: (message: any) => void;
  on: (event: string, listener: (message: any) => void) => unknown;
};

type CoordinatorResult = { type: 'coordinator:result'; reqId: string; allowed: boolean; error?: string };

/**
 * A `RunCoordinator` used inside a background task's daemon (child process). The
 * real coordinator lives in the parent (resolved from setRunCoordinator / the
 * env default) and cannot cross the fork, so this bridge forwards `shouldRun`/
 * `onComplete` to the parent over IPC and the parent runs the real one.
 * Cross-fleet coordination still happens in the shared backend (e.g. Redis) held
 * by each instance's parent; this only bridges child to its own parent.
 */
export class IpcRunCoordinator implements RunCoordinator {
  private pending = new Map<string, (result: CoordinatorResult) => void>();

  constructor(private channel: IpcChannel) {
    this.channel.on('message', (message: any) => {
      if (message?.type !== 'coordinator:result') return;
      const resolve = this.pending.get(message.reqId);
      if (resolve) {
        this.pending.delete(message.reqId);
        resolve(message);
      }
    });
  }

  shouldRun(key: string, ttlMs: number): Promise<boolean> {
    const reqId = createID('coord');
    return new Promise<boolean>((resolve, reject) => {
      this.pending.set(reqId, (result) => {
        // The parent reports a coordinator error by replying with `error`; reject
        // so the runner fails closed (skips the run), mirroring the inline path.
        if (result.error) reject(new Error(result.error));
        else resolve(result.allowed);
      });
      this.channel.send?.({ type: 'coordinator:shouldRun', key, ttlMs, reqId });
    });
  }

  onComplete(key: string): Promise<void> {
    this.channel.send?.({ type: 'coordinator:complete', key });
    return Promise.resolve();
  }
}
