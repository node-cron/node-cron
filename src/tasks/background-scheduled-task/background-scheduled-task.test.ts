import { fork } from 'child_process';

import BackgroundScheduledTask from "./background-scheduled-task";

import { EventEmitter } from 'events';

// fork() is imported via ESM by the production code, so it is mocked at the
// module level (require-based stubbing does not affect the ESM binding).
vi.mock('child_process', () => ({ fork: vi.fn() }));

describe('BackgroundScheduledTask', function() {

  let fakeChildProcess: EventEmitter & { send: ReturnType<typeof vi.fn>; kill: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    fakeChildProcess = Object.assign(new EventEmitter(), {
      send: vi.fn(),
      kill: vi.fn(),
      killed: false
    });

    vi.mocked(fork).mockReturnValue(fakeChildProcess as any);
  });

  afterEach(() => {
    vi.mocked(fork).mockReset();
  });

  it('creates a new background task', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      expect(task.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(task.id).toBe(task.name);
      expect(task.getStatus()).toBe('stopped');
  });

  describe('getNextRun', function(){
    it('returns next run', async function(){
      const task = new BackgroundScheduledTask('* * * * *', './test-assets/dummy-task.js');
      fakeChildProcess.send.mockImplementation((msg: any)=>{
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
        else task.emitter.emit('task:started');
      });

      await task.start();

      const nextMinute = new Date();
      nextMinute.setMilliseconds(0);
      nextMinute.setSeconds(0);
      nextMinute.setMinutes(nextMinute.getMinutes() + 1);

      expect(task.getNextRun()?.getTime()).toBe(nextMinute.getTime());
      await task.destroy();
    });
  });

  describe('start', () => {
    it('do not fail if already started', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess = Object.assign(new EventEmitter(), {
        send: vi.fn(),
        kill: vi.fn()
      });
      task.forkProcess = fakeChildProcess as any;

      const result = await task.start();
      expect(result).toBeUndefined();
    });

    it('starts new fork', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.mockImplementation(()=>{
        task.emitter.emit('task:started');
      });

      const result = await task.start();
      expect(result).toBeUndefined();
    });

    it('fails on fork failure', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.mockImplementation(()=>{
        fakeChildProcess.emit('error', new Error('fake error'));
      });

      try{
        await task.start();
        expect.fail('should throw error no start')
      } catch (error: any){
        expect(error.message).toBe('Error on daemon: fake error');
      }
    });

    it('fails on fork exception', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.mockImplementation(() => { throw new Error('fake error'); });

      try{
        await task.start();
        expect.fail('should throw error no start')
      } catch (error: any){
        expect(error.message).toBe('fake error');
      }
    });

    it('fails on fork exit with code', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.mockImplementation(()=>{
        fakeChildProcess.emit('exit', 9);
      });
      
      try{
        await task.start();
        expect.fail('should throw error no start')
      } catch (error: any){
        expect(error.message).toBe('node-cron daemon exited with code 9');
      }
    });

    it('fails on fork exit with signal', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.mockImplementation(()=>{
        fakeChildProcess.emit('exit', 'SIGNAL');
      });

      try{
        await task.start();
        expect.fail('should throw error no start')
      } catch (error: any){
        expect(error.message).toBe('node-cron daemon exited with code SIGNAL');
      }
    });

    it('ignores clean exit (code 0)', async function(){
      const errorFn = vi.fn();
      const customLogger = { info() {}, warn() {}, error: errorFn, debug() {} };
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { logger: customLogger });

      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') {
          task.emitter.emit('task:started');
          queueMicrotask(() => fakeChildProcess.emit('exit', 0, null));
        }
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });

      await task.start();
      await wait(10);

      expect(errorFn).not.toHaveBeenCalled();
      await task.destroy();
    });

    it('ignores SIGTERM exit', async function(){
      const errorFn = vi.fn();
      const customLogger = { info() {}, warn() {}, error: errorFn, debug() {} };
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { logger: customLogger });

      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') {
          task.emitter.emit('task:started');
          queueMicrotask(() => fakeChildProcess.emit('exit', null, 'SIGTERM'));
        }
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });

      await task.start();
      await wait(10);

      expect(errorFn).not.toHaveBeenCalled();
      await task.destroy();
    });

    it('fails on unexpected signal exit (null code)', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.mockImplementation(() => {
        fakeChildProcess.emit('exit', null, 'SIGKILL');
      });

      try {
        await task.start();
        expect.fail('should throw');
      } catch (error: any){
        expect(error.message).toBe('node-cron daemon exited with code SIGKILL');
      }
    });

    it('starts and bypass events', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.mockImplementation(async ()=>{
        task.emitter.emit('task:started');
        await wait(100);
        fakeChildProcess.emit('message', { event: 'execution:failed', context: { date: new Date(), task: {
          state: task.stateMachine.state,
          ...task
        }, execution: {}}, jsonError: JSON.stringify( { name: 'Error', message: 'task failed', extra: 'extra', stack: 'fake stack'})})
      });

      const waitEvent = new Promise(r => {
        task.on('execution:failed', event => {
          r(event)
        })
      });

      await task.start();
      const event: any = await waitEvent;
      expect(event.execution?.error.message).toBe('task failed');
      expect(event.execution?.error.extra).toBe('extra');
      expect(event.execution?.error.stack).toBe('fake stack');
      expect(event.task.stateMachine.state).toBe('idle')
    });

    it('fails on start timeout', async function(){
      // fakeChildProcess.send is a no-op stub, so the daemon never reports back.
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 40 });

      try {
        await task.start();
        expect.fail("should fail before")
      } catch (error: any){
        expect(error.message).toMatch(/Start operation timed out/);
      }
    });

    it('honours a custom startTimeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 40 });

      const startedAt = Date.now();
      try {
        await task.start();
        expect.fail("should time out");
      } catch (error: any){
        expect(Date.now() - startedAt).toBeLessThan(1000);
        expect(error.message).toMatch(/Start operation timed out/);
      }
    });

    it('explains likely causes in the start timeout error', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 40 });

      try {
        await task.start();
        expect.fail("should time out");
      } catch (error: any){
        // actionable hint, not just "timed out"
        expect(error.message).toMatch(/load|import|startTimeout/i);
      }
    });

    it('rejects start with the real cause when the daemon reports a load error', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 200 });

      fakeChildProcess.send.mockImplementation(()=>{
        fakeChildProcess.emit('message', {
          event: 'daemon:error',
          jsonError: JSON.stringify({ name: 'SyntaxError', message: 'TypeScript enum is not supported in strip-only mode' })
        });
      });

      try {
        await task.start();
        expect.fail("should reject with the real cause");
      } catch (error: any){
        expect(error.message).toBe('TypeScript enum is not supported in strip-only mode');
      }
    });

    it('kills the daemon and clears the fork on a failed start (no orphan)', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 200 });

      fakeChildProcess.send.mockImplementation(()=>{
        fakeChildProcess.emit('message', {
          event: 'daemon:error',
          jsonError: JSON.stringify({ name: 'Error', message: 'boom' })
        });
      });

      try { await task.start(); } catch { /* expected */ }

      expect(fakeChildProcess.kill).toHaveBeenCalled();
      expect(task.forkProcess).toBeUndefined();
    });

    it('kills the daemon when the start times out (no orphan)', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 40 });

      try { await task.start(); } catch { /* expected */ }

      expect(fakeChildProcess.kill).toHaveBeenCalled();
      expect(task.forkProcess).toBeUndefined();
    });
  });

  describe('stop', function(){
    it('do not fail if the task is stoped', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      const result = await task.stop();
      expect(result).toBeUndefined();
    });

    it('stop the task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      task.forkProcess = fakeChildProcess as any;
      fakeChildProcess.send.mockImplementation(()=>{
        task.emitter.emit('task:stopped');
      });

      const result = await task.stop();
      expect(result).toBeUndefined();
    });

    it('fails on stop timeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;

      try {
        await task.stop();
        expect.fail("should fail before")
      } catch (error: any){
        expect(error.message).toBe('Stop operation timed out');
      }
    });

    it('kills the fork process when stop times out (no orphan)', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;

      try { await task.stop(); } catch { /* expected timeout */ }

      expect(fakeChildProcess.kill).toHaveBeenCalled();
      expect(task.forkProcess).toBeUndefined();
    });
  });

  describe('destroy', function(){
    it('destroys stopped task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      const result = await task.destroy();
      expect(result).toBeUndefined();
    });

    it('transitions to destroyed when forkProcess is absent', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      expect(task.getStatus()).toBe('stopped');

      await task.destroy();
      expect(task.getStatus()).toBe('destroyed');
    });

    it('emits task:destroyed when forkProcess is absent', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      let emitted = false;
      task.on('task:destroyed', () => { emitted = true; });

      await task.destroy();
      expect(emitted).toBe(true);
    });

    it('transitions to stopped on stop() when forkProcess is absent', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      // Already stopped, should remain stopped without error
      await task.stop();
      expect(task.getStatus()).toBe('stopped');
    });

    it('is a no-op when already destroyed', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      await task.destroy();
      expect(task.getStatus()).toBe('destroyed');

      // Second destroy should not throw
      await task.destroy();
      expect(task.getStatus()).toBe('destroyed');
    });

    it('destroys a task an kills the fork', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;

      fakeChildProcess.send.mockImplementation(()=>{
        task.emitter.emit('task:destroyed');
      });

      const result = await task.destroy();
      expect(result).toBeUndefined();
    });

    it('fails on destriy timeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;

      try {
        await task.destroy();
        expect.fail("should fail before")
      } catch (error: any){
        expect(error.message).toBe('Destroy operation timed out');
      }
    });

    it('kills the fork process when destroy times out (no orphan)', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;

      try { await task.destroy(); } catch { /* expected timeout */ }

      expect(fakeChildProcess.kill).toHaveBeenCalled();
      expect(task.forkProcess).toBeUndefined();
    });
  });

  describe('state sync from daemon messages', function(){
    it('transitions to running when daemon reports execution:started', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') {
          task.emitter.emit('task:started');
        } else if (msg.command === 'task:execute') {
          const now = new Date().toISOString();
          fakeChildProcess.emit('message', {
            event: 'execution:started',
            context: {
              date: now,
              task: { id: task.id, name: task.name, state: 'running' },
              execution: { id: 'e1', reason: 'invoked', startedAt: now }
            }
          });
        }
      });

      await task.start();
      expect(task.getStatus()).toBe('idle');

      task.execute().catch(() => {});
      await new Promise(r => setTimeout(r, 50));

      expect(task.getStatus()).toBe('running');
    });

    it('transitions back to idle when daemon reports execution:finished', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') {
          task.emitter.emit('task:started');
        } else if (msg.command === 'task:execute') {
          const now = new Date().toISOString();
          fakeChildProcess.emit('message', {
            event: 'execution:started',
            context: {
              date: now,
              task: { id: task.id, name: task.name, state: 'running' },
              execution: { id: 'e1', reason: 'invoked', startedAt: now }
            }
          });
          queueMicrotask(() => {
            fakeChildProcess.emit('message', {
              event: 'execution:finished',
              context: {
                date: now,
                task: { id: task.id, name: task.name, state: 'idle' },
                execution: { id: 'e1', reason: 'invoked', startedAt: now, finishedAt: now, result: 'ok' }
              }
            });
          });
        }
      });

      await task.start();
      await task.execute();
      expect(task.getStatus()).toBe('idle');
    });
  });

  describe('execute', function(){
    it('fails when call execute on stoped task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      try {
        await task.execute();
      } catch(error: any){
        expect(error.message).toBe("Cannot execute background task because it hasn't been started yet. Please initialize the task using the start() method before attempting to execute it.")
      }
    });

    it('executes a task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.mockImplementation((obj)=>{
        if(obj.command === 'task:execute'){
          task.emitter.emit('execution:finished', {execution: { result: "task result"}});
        } else {
          task.emitter.emit('task:started');
        }
      })

      await task.start();
      
      const result = await task.execute();
      expect(result).toBe('task result');
    });

    it('throw error on execution fail', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.mockImplementation((obj)=>{
        if(obj.command === 'task:execute'){
          task.emitter.emit('execution:failed', {execution: { error: Error("task error")}});
        } else {
          task.emitter.emit('task:started');
        }
      })

      await task.start();

      try{
      await task.execute();
      } catch(error: any){
        expect(error.message).toBe('task error');
      }
    });

    it('rejects with generic error when execution:failed has no error', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.mockImplementation((obj: any) => {
        if(obj.command === 'task:execute'){
          task.emitter.emit('execution:failed', { execution: {} });
        } else {
          task.emitter.emit('task:started');
        }
      });

      await task.start();

      try {
        await task.execute();
        expect.fail('should have thrown');
      } catch(error: any){
        expect(error.message).toBe('Execution failed without specific error');
      }
    });

    it('fails on execute when executeTimeout is exceeded', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { executeTimeout: 50 });

      // Only acknowledges start; never reports the execution back, so the
      // configured timeout is what ends execute().
      fakeChildProcess.send.mockImplementation((obj)=>{
        if(obj.command === 'task:start'){
          task.emitter.emit('task:started');
        }
      })

      await task.start();

      try {
        await task.execute();
        expect.fail("should fail before")
      } catch (error: any){
        expect(error.message).toBe('Execution timeout exceeded');
      }
    });

    it('does not impose a timeout by default', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      // Report the result only after a delay; with no executeTimeout, execute()
      // must wait for it rather than rejecting.
      fakeChildProcess.send.mockImplementation((obj)=>{
        if(obj.command === 'task:execute'){
          setTimeout(() => task.emitter.emit('execution:finished', {execution: { result: "late result"}}), 50);
        } else {
          task.emitter.emit('task:started');
        }
      })

      await task.start();

      const result = await task.execute();
      expect(result).toBe('late result');
    });
  });

  describe('introspection', function(){
    it('getPattern returns the expression', function(){
      const task = new BackgroundScheduledTask('0 0 12 * * *', './test-assets/dummy-task.js');
      expect(task.getPattern()).toBe('0 0 12 * * *');
    });

    it('match and getNextRuns compute locally (no daemon needed)', function(){
      const task = new BackgroundScheduledTask('0 0 12 * * *', './test-assets/dummy-task.js', { timezone: 'Etc/UTC' });
      expect(task.match(new Date('2025-06-15T12:00:00Z'))).toBe(true);
      expect(task.match(new Date('2025-06-15T12:00:01Z'))).toBe(false);
      const runs = task.getNextRuns(3);
      expect(runs).toHaveLength(3);
      expect(runs[1].getTime()).toBeGreaterThan(runs[0].getTime());
    });

    it('runsLeft tracks executions reported by the daemon', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { maxExecutions: 3 });
      expect(task.runsLeft()).toBe(3);
      task.emitter.emit('execution:started', {} as any);
      task.emitter.emit('execution:started', {} as any);
      expect(task.runsLeft()).toBe(1);
    });

    it('runsLeft is undefined without maxExecutions', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      expect(task.runsLeft()).toBeUndefined();
    });

    it('isBusy is false when not executing', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      expect(task.isBusy()).toBe(false);
    });

    it('lastRun is null before the first execution', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      expect(task.lastRun()).toBeNull();
    });

    it('lastRun reports the execution time and result from the daemon', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const finishedAt = new Date('2025-06-15T12:00:00.123Z');
      task.emitter.emit('execution:finished', { execution: { finishedAt, result: 'ok' } } as any);

      const last = task.lastRun();
      expect(last).not.toBeNull();
      expect(last!.date).toBeInstanceOf(Date);
      expect(last!.date.getTime()).toBe(finishedAt.getTime());
      expect(last!.result).toBe('ok');
      expect(last!.error).toBeUndefined();
    });

    it('lastRun reports the execution time and error from the daemon', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const finishedAt = new Date('2025-06-15T12:00:00.000Z');
      const error = new Error('boom');
      task.emitter.emit('execution:failed', { execution: { finishedAt, error } } as any);

      const last = task.lastRun();
      expect(last).not.toBeNull();
      expect(last!.date.getTime()).toBe(finishedAt.getTime());
      expect(last!.error).toBe(error);
      expect(last!.result).toBeUndefined();
    });

    it('lastRun coerces an ISO-string timestamp from IPC back to a Date', function(){
      // Over IPC the execution timestamps may arrive serialized as strings.
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.emitter.emit('execution:finished', { execution: { finishedAt: '2025-06-15T12:00:00.000Z', result: 1 } } as any);

      const last = task.lastRun();
      expect(last!.date).toBeInstanceOf(Date);
      expect(last!.date.toISOString()).toBe('2025-06-15T12:00:00.000Z');
    });

    it('lastRun updates to the most recent execution', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.emitter.emit('execution:finished', { execution: { finishedAt: new Date(), result: 'first' } } as any);
      expect(task.lastRun()!.result).toBe('first');
      task.emitter.emit('execution:finished', { execution: { finishedAt: new Date(), result: 'second' } } as any);
      expect(task.lastRun()!.result).toBe('second');
    });

    it('lastRun falls back to startedAt when finishedAt is absent', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const startedAt = new Date('2025-06-15T12:00:00.000Z');
      task.emitter.emit('execution:finished', { execution: { startedAt, result: 'ok' } } as any);

      const last = task.lastRun();
      expect(last!.date.getTime()).toBe(startedAt.getTime());
      expect(last!.result).toBe('ok');
    });

    it('lastRun uses the current time when the execution carries no timestamp', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const before = Date.now();
      task.emitter.emit('execution:finished', { execution: { result: 'ok' } } as any);
      const after = Date.now();

      const last = task.lastRun();
      expect(last!.date).toBeInstanceOf(Date);
      expect(last!.date.getTime()).toBeGreaterThanOrEqual(before);
      expect(last!.date.getTime()).toBeLessThanOrEqual(after);
    });

    it('lastRun ignores a forwarded event that carries no execution', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.emitter.emit('execution:finished', {} as any);
      expect(task.lastRun()).toBeNull();
    });

    it('msToNext is null when stopped and a positive number once started', async function(){
      const task = new BackgroundScheduledTask('* * * * *', './test-assets/dummy-task.js', { timezone: 'Etc/UTC' });
      expect(task.msToNext()).toBeNull();

      fakeChildProcess.send.mockImplementation((msg: any)=>{
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
        else task.emitter.emit('task:started');
      });
      await task.start();
      const ms = task.msToNext();
      expect(ms).not.toBeNull();
      expect(ms as number).toBeGreaterThan(0);
      await task.destroy();
    });
  });

  describe('run coordination over IPC', function () {
    function makeCoordinator(behavior: { shouldRunReturns?: boolean; shouldRunThrows?: boolean } = {}) {
      const calls = { shouldRun: [] as { key: string; ttl: number }[], onComplete: [] as string[] };
      return {
        calls,
        async shouldRun(key: string, ttl: number) {
          calls.shouldRun.push({ key, ttl });
          if (behavior.shouldRunThrows) throw new Error('coordinator down');
          return behavior.shouldRunReturns ?? true;
        },
        async onComplete(key: string) { calls.onComplete.push(key); },
      };
    }

    async function startTask(options: any) {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', options);
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
        else if (msg.command === 'task:start') task.emitter.emit('task:started');
      });
      await task.start();
      return task;
    }

    const startDistributed = (coordinator: any) => startTask({ name: 'job', distributed: true, runCoordinator: coordinator });
    const replyOf = () => fakeChildProcess.send.mock.calls.map((c: any[]) => c[0]).find((a: any) => a?.type === 'coordinator:result');

    it('runs the coordinator and replies allowed:true on coordinator:shouldRun', async function () {
      const coordinator = makeCoordinator();
      const task = await startDistributed(coordinator);

      fakeChildProcess.emit('message', { type: 'coordinator:shouldRun', key: 'job:t', ttlMs: 5000, reqId: 'r1' });
      await wait(10);

      expect(coordinator.calls.shouldRun).toEqual([{ key: 'job:t', ttl: 5000 }]);
      const reply = replyOf();
      expect(reply.reqId).toBe('r1');
      expect(reply.allowed).toBe(true);
      expect(reply.error).toBeUndefined();
      await task.destroy();
    });

    it('replies allowed:false when not elected', async function () {
      const coordinator = makeCoordinator({ shouldRunReturns: false });
      const task = await startDistributed(coordinator);

      fakeChildProcess.emit('message', { type: 'coordinator:shouldRun', key: 'job:t', ttlMs: 5000, reqId: 'r2' });
      await wait(10);

      expect(replyOf().allowed).toBe(false);
      await task.destroy();
    });

    it('reports a coordinator error so the daemon fails closed', async function () {
      const coordinator = makeCoordinator({ shouldRunThrows: true });
      const task = await startDistributed(coordinator);

      fakeChildProcess.emit('message', { type: 'coordinator:shouldRun', key: 'job:t', ttlMs: 5000, reqId: 'r3' });
      await wait(10);

      const reply = replyOf();
      expect(reply.allowed).toBe(false);
      expect(reply.error).toMatch(/coordinator down/);
      await task.destroy();
    });

    it('completes via the coordinator on coordinator:complete', async function () {
      const coordinator = makeCoordinator();
      const task = await startDistributed(coordinator);

      fakeChildProcess.emit('message', { type: 'coordinator:complete', key: 'job:t' });
      await wait(10);

      expect(coordinator.calls.onComplete).toEqual(['job:t']);
      await task.destroy();
    });

    it('replies allowed:false when no coordinator is resolved', async function () {
      // A non-distributed task has no coordinator: a stray request still gets a
      // safe (fail-closed) reply instead of hanging the daemon.
      const task = await startTask({ name: 'job' });

      fakeChildProcess.emit('message', { type: 'coordinator:shouldRun', key: 'job:t', ttlMs: 5000, reqId: 'r4' });
      await wait(10);

      expect(replyOf().allowed).toBe(false);
      await task.destroy();
    });
  });

  describe('logEvent', function () {
    it('logs a warning on execution:missed when no listener is attached', async function () {
      const warnFn = vi.fn();
      const customLogger = { info() {}, warn: warnFn, error() {}, debug() {} };
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { logger: customLogger });
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      fakeChildProcess.emit('message', {
        event: 'execution:missed',
        context: { date: new Date().toISOString() }
      });
      await wait(10);

      expect(warnFn).toHaveBeenCalledOnce();
      expect(warnFn.mock.calls[0][0]).toMatch(/missed execution/);
      await task.destroy();
    });

    it('suppresses missed warning when suppressMissedWarning is set', async function () {
      const warnFn = vi.fn();
      const customLogger = { info() {}, warn: warnFn, error() {}, debug() {} };
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', {
        logger: customLogger,
        suppressMissedWarning: true
      });
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      fakeChildProcess.emit('message', {
        event: 'execution:missed',
        context: { date: new Date().toISOString() }
      });
      await wait(10);

      expect(warnFn).not.toHaveBeenCalled();
      await task.destroy();
    });

    it('logs a warning on execution:overlap when noOverlap is set', async function () {
      const warnFn = vi.fn();
      const customLogger = { info() {}, warn: warnFn, error() {}, debug() {} };
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', {
        logger: customLogger,
        noOverlap: true
      });
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      fakeChildProcess.emit('message', {
        event: 'execution:overlap',
        context: { date: new Date().toISOString() }
      });
      await wait(10);

      expect(warnFn).toHaveBeenCalledOnce();
      expect(warnFn.mock.calls[0][0]).toMatch(/overlap/);
      await task.destroy();
    });

    it('logs error on execution:failed with an error', async function () {
      const errorFn = vi.fn();
      const customLogger = { info() {}, warn() {}, error: errorFn, debug() {} };
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { logger: customLogger });
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      const serializedError = JSON.stringify({ name: 'Error', message: 'task exploded', stack: '' });
      fakeChildProcess.emit('message', {
        event: 'execution:failed',
        jsonError: serializedError,
        context: {
          date: new Date().toISOString(),
          execution: { id: 'e1', reason: 'scheduled', hasError: true }
        }
      });
      await wait(10);

      expect(errorFn).toHaveBeenCalledOnce();
      await task.destroy();
    });

    it('does not log on execution:failed without an error', async function () {
      const errorFn = vi.fn();
      const customLogger = { info() {}, warn() {}, error: errorFn, debug() {} };
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { logger: customLogger });
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      fakeChildProcess.emit('message', {
        event: 'execution:failed',
        context: {
          date: new Date().toISOString(),
          execution: { id: 'e2', reason: 'scheduled' }
        }
      });
      await wait(10);

      expect(errorFn).not.toHaveBeenCalled();
      await task.destroy();
    });

    it('does not log overlap warning when noOverlap is not set', async function () {
      const warnFn = vi.fn();
      const customLogger = { info() {}, warn: warnFn, error() {}, debug() {} };
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', {
        logger: customLogger
      });
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      fakeChildProcess.emit('message', {
        event: 'execution:overlap',
        context: { date: new Date().toISOString() }
      });
      await wait(10);

      expect(warnFn).not.toHaveBeenCalled();
      await task.destroy();
    });
  });

  describe('IPC message edge cases', function () {
    it('handles jsonError without context.execution', async function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      fakeChildProcess.emit('message', {
        event: 'execution:failed',
        jsonError: JSON.stringify({ name: 'Error', message: 'orphan error' }),
        context: { date: new Date().toISOString() }
      });
      await wait(10);
      await task.destroy();
    });

    it('handles a message with no context', async function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      fakeChildProcess.emit('message', { event: 'some:event' });
      await wait(10);
      await task.destroy();
    });

    it('handles daemon:error without jsonError', async function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') {
          queueMicrotask(() => {
            fakeChildProcess.emit('message', { event: 'daemon:error' });
          });
        }
      });
      await expect(task.start()).rejects.toThrow('Background task failed to start');
    });

    it('handles a message with task state but no context body', async function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      fakeChildProcess.emit('message', {
        event: 'execution:started',
        context: {
          date: new Date().toISOString(),
          task: { id: task.id, name: task.name, state: 'running' },
          execution: { id: 'e1', reason: 'scheduled', startedAt: new Date().toISOString() }
        }
      });
      await wait(10);

      expect(task.getStatus()).toBe('running');
      await task.destroy();
    });
  });

  describe('deserializeError', function () {
    it('reconstructs a TypeError from serialized JSON', async function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      const serialized = JSON.stringify({ name: 'TypeError', message: 'x is not a function', stack: 'TypeError: x is not a function' });
      const failPromise = new Promise<any>(resolve => {
        task.on('execution:failed', (ctx) => resolve(ctx.execution?.error));
      });

      fakeChildProcess.emit('message', {
        event: 'execution:failed',
        jsonError: serialized,
        context: {
          date: new Date().toISOString(),
          execution: { id: 'e1', reason: 'scheduled', hasError: true }
        }
      });

      const err = await failPromise;
      expect(err).toBeInstanceOf(TypeError);
      expect(err.message).toBe('x is not a function');
      await task.destroy();
    });

    it('falls back to Error for unknown error names', async function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      const serialized = JSON.stringify({ name: 'CustomAppError', message: 'custom', stack: '', code: 'APP_ERR' });
      const failPromise = new Promise<any>(resolve => {
        task.on('execution:failed', (ctx) => resolve(ctx.execution?.error));
      });

      fakeChildProcess.emit('message', {
        event: 'execution:failed',
        jsonError: serialized,
        context: {
          date: new Date().toISOString(),
          execution: { id: 'e2', reason: 'scheduled', hasError: true }
        }
      });

      const err = await failPromise;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('custom');
      expect(err.code).toBe('APP_ERR');
      await task.destroy();
    });
  });

  describe('createContext', function () {
    it('includes skip reason when present', async function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      await task.start();

      const skippedPromise = new Promise<any>(resolve => {
        task.on('execution:skipped', resolve);
      });

      fakeChildProcess.emit('message', {
        event: 'execution:skipped',
        context: {
          date: new Date().toISOString(),
          reason: 'not-elected'
        }
      });

      const ctx = await skippedPromise;
      expect(ctx.reason).toBe('not-elected');
      await task.destroy();
    });
  });

  describe('unref / ref', function () {
    it('unref calls unref on the fork process', async function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const unrefStub = vi.fn();
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      (fakeChildProcess as any).unref = unrefStub;

      await task.start();
      task.unref();

      expect(unrefStub).toHaveBeenCalledOnce();
      await task.destroy();
    });

    it('ref calls ref on the fork process', async function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const refStub = vi.fn();
      fakeChildProcess.send.mockImplementation((msg: any) => {
        if (msg.command === 'task:start') task.emitter.emit('task:started');
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
      });
      (fakeChildProcess as any).ref = refStub;

      await task.start();
      task.ref();

      expect(refStub).toHaveBeenCalledOnce();
      await task.destroy();
    });

    it('unref is safe to call before start', function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.unref();
    });

    it('ref is safe to call before start', function () {
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.ref();
    });
  });
});


function wait(time: number){
  return new Promise(r=> setTimeout(r, time));
}