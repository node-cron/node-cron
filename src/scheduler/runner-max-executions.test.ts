import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTask, schedule } from '../node-cron';
import { Runner } from './runner';
import { TimeMatcher } from '../time/time-matcher';

const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// Exercise the public API with native timers as well as the controlled races below.
describe('maxExecutions with native timers', () => {
  it.each([1, 2])('admits only %i slow scheduled callbacks', async maxExecutions => {
    const events: string[] = [];
    let calls = 0;
    const task = createTask('* * * * * *', async () => {
      calls++;
      await pause(2500);
    }, { maxExecutions, timezone: 'UTC' });
    task.on('execution:started', () => { events.push('started'); });
    task.on('execution:maxReached', () => { events.push('maxReached'); });
    try {
      task.start();
      await pause(4800);
      expect(calls).toBe(maxExecutions);
      expect(events.filter(event => event === 'started')).toHaveLength(maxExecutions);
      expect(events.filter(event => event === 'maxReached')).toHaveLength(1);
      expect(task.getStatus()).toBe('destroyed');
      expect(task.runsLeft()).toBe(0);
    } finally {
      task.destroy();
    }
  });
});

describe('scheduled execution admission', () => {
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

  it('checks the cap again after asynchronous beforeRun hooks', async () => {
    const hooks: Array<(allowed: boolean) => void> = [];
    const callback = vi.fn(() => pause(3000));
    const onMaxExecutions = vi.fn();
    const runner = track(new Runner(new TimeMatcher('* * * * * *'), callback, {
      maxExecutions: 1,
      beforeRun: () => new Promise<boolean>(resolve => hooks.push(resolve)),
      onMaxExecutions
    }));
    runner.start();
    await vi.advanceTimersByTimeAsync(2000);
    expect(hooks).toHaveLength(2);
    for (const release of hooks) release(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(runner.runCount).toBe(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(onMaxExecutions).toHaveBeenCalledTimes(1);
  });

  it('does not consume the budget when beforeRun declines or throws', async () => {
    const beforeRun = vi.fn().mockReturnValueOnce(false).mockRejectedValueOnce(new Error('hook')).mockReturnValue(true);
    const callback = vi.fn();
    const onError = vi.fn();
    const runner = track(new Runner(new TimeMatcher('* * * * * *'), callback, { maxExecutions: 1, beforeRun, onError }));
    runner.start();
    await vi.advanceTimersByTimeAsync(3000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(runner.runCount).toBe(1);
  });

  it('does not start another jittered execution or emit its started event after the cap', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const callback = vi.fn(() => pause(4000));
    const task = schedule('* * * * * *', callback, { maxExecutions: 1, maxRandomDelay: 2500 });
    const started = vi.fn();
    task.on('execution:started', started);
    try {
      await vi.advanceTimersByTimeAsync(7000);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(started).toHaveBeenCalledTimes(1);
      expect(task.getStatus()).toBe('destroyed');
    } finally {
      task.destroy();
    }
  });

  it.each(['stop', 'destroy'] as const)('honours %s from an execution:started listener', async action => {
    const callback = vi.fn();
    const task = createTask('* * * * * *', callback, { maxExecutions: 1 });
    task.on('execution:started', () => task[action]());
    try {
      task.start();
      await vi.advanceTimersByTimeAsync(2000);
      expect(callback).not.toHaveBeenCalled();
      expect(task.runsLeft()).toBe(1);
      expect(task.getStatus()).toBe(action === 'stop' ? 'stopped' : 'destroyed');
    } finally {
      task.destroy();
    }
  });

  it('does not revive an old asynchronous beforeRun after stop and restart', async () => {
    const hooks: Array<(allowed: boolean) => void> = [];
    const callback = vi.fn();
    const runner = track(new Runner(new TimeMatcher('* * * * * *'), callback, {
      maxExecutions: 1,
      beforeRun: () => new Promise<boolean>(resolve => hooks.push(resolve))
    }));
    runner.start();
    await vi.advanceTimersByTimeAsync(1000);
    runner.stop();
    runner.start();
    hooks[0](true);
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    hooks[1](true);
    await vi.advanceTimersByTimeAsync(0);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('emits maxReached once when overlapping callbacks settle out of order', async () => {
    const releases: Array<() => void> = [];
    const task = createTask('* * * * * *', () => new Promise<void>(resolve => releases.push(resolve)), { maxExecutions: 2 });
    const events: string[] = [];
    task.on('execution:finished', () => { events.push('finished'); });
    task.on('execution:maxReached', () => { events.push('maxReached'); });
    task.on('task:destroyed', () => { events.push('destroyed'); });
    try {
      task.start();
      await vi.advanceTimersByTimeAsync(3000);
      expect(releases).toHaveLength(2);
      releases[1]();
      await vi.advanceTimersByTimeAsync(0);
      expect(events).toEqual(['finished', 'maxReached', 'destroyed']);
      releases[0]();
      await vi.advanceTimersByTimeAsync(0);
      expect(events).toEqual(['finished', 'maxReached', 'destroyed', 'finished']);
      expect(task.getStatus()).toBe('destroyed');
    } finally {
      for (const release of releases) release();
      task.destroy();
    }
  });
});
