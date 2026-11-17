import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTask } from '../node-cron';
import { Runner } from './runner';
import { TimeMatcher } from '../time/time-matcher';

const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

describe('restart from a public execution listener with native timers', () => {
  it.each([undefined, 1])('preserves progress with maxExecutions %s', async maxExecutions => {
    let restarted = false, started = 0, maxReached = 0;
    const callbackStartedCounts: number[] = [];
    const task = createTask('* * * * * *', () => {
      callbackStartedCounts.push(started);
    }, { maxExecutions, timezone: 'UTC' });
    task.on('execution:started', () => {
      started++;
      if (!restarted) {
        restarted = true;
        task.stop();
        task.start();
      }
    });
    task.on('execution:maxReached', () => { maxReached++; });
    try {
      task.start();
      await pause(3300);
      expect(callbackStartedCounts.length).toBeGreaterThan(0);
      expect(callbackStartedCounts.every(count => count >= 2)).toBe(true);
      if (maxExecutions !== undefined) {
        expect(callbackStartedCounts).toEqual([2]);
        expect(task.runsLeft()).toBe(0);
        expect(maxReached).toBe(1);
        expect(task.getStatus()).toBe('destroyed');
      }
    } finally {
      task.destroy();
    }
  });
});

describe('restart scheduling ownership', () => {
  const runners: Runner[] = [];
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });
  afterEach(() => {
    for (const runner of runners) runner.stop();
    runners.length = 0;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  const track = (runner: Runner) => { runners.push(runner); return runner; };

  it('preserves the new heartbeat when an overlap listener restarts the runner', async () => {
    const releases: Array<() => void> = [];
    const callback = vi.fn(() => new Promise<void>(resolve => releases.push(resolve)));
    let restarted = false;
    let restartedTimer: NodeJS.Timeout | undefined;
    const onMaxExecutions = vi.fn();
    const runner = track(new Runner(new TimeMatcher('* * * * * *'), callback, {
      maxExecutions: 2,
      noOverlap: true,
      onMaxExecutions,
      onOverlap() {
        if (!restarted) {
          restarted = true;
          runner.stop();
          runner.start();
          restartedTimer = runner.heartBeatTimeout;
        }
      }
    }));
    try {
      runner.start();
      await vi.advanceTimersByTimeAsync(2000);
      expect(runner.heartBeatTimeout).toBe(restartedTimer);
      await vi.advanceTimersByTimeAsync(1000);
      expect(callback).toHaveBeenCalledTimes(2);
      for (const release of releases) release();
      await vi.advanceTimersByTimeAsync(0);
      expect(onMaxExecutions).toHaveBeenCalledTimes(1);
    } finally {
      for (const release of releases) release();
    }
  });

  it('preserves the new heartbeat when a missed-execution listener restarts it', async () => {
    const callback = vi.fn();
    let restarted = false;
    let restartedTimer: NodeJS.Timeout | undefined;
    const runner = track(new Runner(new TimeMatcher('* * * * * *'), callback, {
      onMissedExecution() {
        if (!restarted) {
          restarted = true;
          runner.stop();
          runner.start();
          restartedTimer = runner.heartBeatTimeout;
        }
      }
    }));
    runner.start();
    vi.setSystemTime(new Date('2026-01-01T00:00:05Z'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(restarted).toBe(true);
    expect(callback).not.toHaveBeenCalled();
    expect(runner.heartBeatTimeout).toBe(restartedTimer);
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('ignores an obsolete heartbeat that was already queued before stop', async () => {
    const timers = vi.spyOn(globalThis, 'setTimeout');
    const callback = vi.fn();
    const runner = track(new Runner(new TimeMatcher('* * * * * *'), callback));
    runner.start();
    const oldHeartbeat = timers.mock.calls[0][0] as () => Promise<void>;
    runner.stop();
    runner.start();
    const restartedTimer = runner.heartBeatTimeout;
    await oldHeartbeat();
    expect(runner.heartBeatTimeout).toBe(restartedTimer);
    expect(callback).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not replace new jitter ownership after an old coordinator wait resolves', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const elections: Array<(allowed: boolean) => void> = [];
    const callback = vi.fn();
    const runner = track(new Runner(new TimeMatcher('* * * * * *'), callback, {
      maxExecutions: 1,
      maxRandomDelay: 500,
      runCoordinator: {
        shouldRun: () => new Promise<boolean>(resolve => elections.push(resolve))
      }
    }));
    runner.start();
    await vi.advanceTimersByTimeAsync(1000);
    runner.stop();
    runner.start();
    await vi.advanceTimersByTimeAsync(1000);
    elections[1](true);
    await vi.advanceTimersByTimeAsync(0);
    const restartedJitter = (runner as any).jitterTimeout;
    expect(restartedJitter).toBeDefined();
    elections[0](true);
    await vi.advanceTimersByTimeAsync(0);
    expect((runner as any).jitterTimeout).toBe(restartedJitter);
    await vi.advanceTimersByTimeAsync(250);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(runner.runCount).toBe(1);
    expect(runner.isStopped()).toBe(true);
  });
});
