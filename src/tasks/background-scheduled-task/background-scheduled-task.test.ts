import { assert } from 'chai';
import { fork } from 'child_process';
import sinon from 'sinon';

import BackgroundScheduledTask from "./background-scheduled-task";

import { EventEmitter } from 'events';

// fork() is imported via ESM by the production code, so it is mocked at the
// module level (require-based stubbing does not affect the ESM binding).
vi.mock('child_process', () => ({ fork: vi.fn() }));

describe('BackgroundScheduledTask', function() {

  let fakeChildProcess: EventEmitter & { send: sinon.SinonStub; kill: sinon.SinonStub };

  beforeEach(() => {
    fakeChildProcess = Object.assign(new EventEmitter(), {
      send: sinon.stub(),
      kill: sinon.stub(),
      killed: false
    });

    vi.mocked(fork).mockReturnValue(fakeChildProcess as any);
  });

  afterEach(() => {
    sinon.restore();
    vi.mocked(fork).mockReset();
  });

  it('creates a new background task', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      assert.match(task.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      assert.equal(task.id, task.name);
      assert.equal(task.getStatus(), 'stopped');
  });

  describe('getNextRun', function(){
    it('returns next run', async function(){
      const task = new BackgroundScheduledTask('* * * * *', './test-assets/dummy-task.js');
      fakeChildProcess.send.callsFake((msg: any)=>{
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
        else task.emitter.emit('task:started');
      });

      await task.start();

      const nextMinute = new Date();
      nextMinute.setMilliseconds(0);
      nextMinute.setSeconds(0);
      nextMinute.setMinutes(nextMinute.getMinutes() + 1);

      assert.equal(task.getNextRun()?.getTime(), nextMinute.getTime());
      await task.destroy();
    });
  });

  describe('start', () => {
    it('do not fail if already started', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess = Object.assign(new EventEmitter(), {
        send: sinon.stub(),
        kill: sinon.stub()
      });
      task.forkProcess = fakeChildProcess as any;

      const result = await task.start();
      assert.isUndefined(result);
    });

    it('starts new fork', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(()=>{
        task.emitter.emit('task:started');
      });

      const result = await task.start();
      assert.isUndefined(result);
    });

    it('fails on fork failure', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(()=>{
        fakeChildProcess.emit('error', new Error('fake error'));
      });

      try{
        await task.start();
        assert.fail('should throw error no start')
      } catch (error: any){
        assert.equal(error.message, 'Error on daemon: fake error');
      }
    });

    it('fails on fork exception', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.throws(new Error('fake error'));

      try{
        await task.start();
        assert.fail('should throw error no start')
      } catch (error: any){
        assert.equal(error.message, 'fake error');
      }
    });

    it('fails on fork exit with code', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(()=>{
        fakeChildProcess.emit('exit', 9);
      });
      
      try{
        await task.start();
        assert.fail('should throw error no start')
      } catch (error: any){
        assert.equal(error.message, 'node-cron daemon exited with code 9');
      }
    });

    it('fails on fork exit with signal', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(()=>{
        fakeChildProcess.emit('exit', 'SIGNAL');
      });
      
      try{
        await task.start();
        assert.fail('should throw error no start')
      } catch (error: any){
        assert.equal(error.message, 'node-cron daemon exited with code SIGNAL');
      }
    });

    it('starts and bypass events', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(async ()=>{
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
      assert.equal(event.execution?.error.message, 'task failed');
      assert.equal(event.execution?.error.extra, 'extra');
      assert.equal(event.execution?.error.stack, 'fake stack');
      assert.equal(event.task.stateMachine.state, 'idle')
    });

    it('fails on start timeout', async function(){
      // fakeChildProcess.send is a no-op stub, so the daemon never reports back.
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 40 });

      try {
        await task.start();
        assert.fail("should fail before")
      } catch (error: any){
        assert.match(error.message, /Start operation timed out/);
      }
    });

    it('honours a custom startTimeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 40 });

      const startedAt = Date.now();
      try {
        await task.start();
        assert.fail("should time out");
      } catch (error: any){
        assert.isBelow(Date.now() - startedAt, 1000, 'should reject well before the 5s default');
        assert.match(error.message, /Start operation timed out/);
      }
    });

    it('explains likely causes in the start timeout error', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 40 });

      try {
        await task.start();
        assert.fail("should time out");
      } catch (error: any){
        // actionable hint, not just "timed out"
        assert.match(error.message, /load|import|startTimeout/i);
      }
    });

    it('rejects start with the real cause when the daemon reports a load error', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 200 });

      fakeChildProcess.send.callsFake(()=>{
        fakeChildProcess.emit('message', {
          event: 'daemon:error',
          jsonError: JSON.stringify({ name: 'SyntaxError', message: 'TypeScript enum is not supported in strip-only mode' })
        });
      });

      try {
        await task.start();
        assert.fail("should reject with the real cause");
      } catch (error: any){
        assert.equal(error.message, 'TypeScript enum is not supported in strip-only mode');
      }
    });

    it('kills the daemon and clears the fork on a failed start (no orphan)', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 200 });

      fakeChildProcess.send.callsFake(()=>{
        fakeChildProcess.emit('message', {
          event: 'daemon:error',
          jsonError: JSON.stringify({ name: 'Error', message: 'boom' })
        });
      });

      try { await task.start(); } catch { /* expected */ }

      assert.isTrue(fakeChildProcess.kill.called, 'the daemon must be killed so it cannot keep running');
      assert.isUndefined(task.forkProcess, 'forkProcess must be cleared after a failed start');
    });

    it('kills the daemon when the start times out (no orphan)', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { startTimeout: 40 });

      try { await task.start(); } catch { /* expected */ }

      assert.isTrue(fakeChildProcess.kill.called, 'a daemon that started late must not be left running');
      assert.isUndefined(task.forkProcess, 'forkProcess must be cleared after a timed-out start');
    });
  });

  describe('stop', function(){
    it('do not fail if the task is stoped', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      const result = await task.stop();
      assert.isUndefined(result);
    });

    it('stop the task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      task.forkProcess = fakeChildProcess as any;
      fakeChildProcess.send.callsFake(()=>{
        task.emitter.emit('task:stopped');
      });

      const result = await task.stop();
      assert.isUndefined(result);
    });

    it('fails on stop timeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;
   
      try {
        await task.stop();
        assert.fail("should fail before")
      } catch (error: any){
        assert.equal(error.message, 'Stop operation timed out');
      }
    });
  });

  describe('destroy', function(){
    it('destroys stopped task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      const result = await task.destroy();
      assert.isUndefined(result);
    });

    it('transitions to destroyed when forkProcess is absent', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      assert.equal(task.getStatus(), 'stopped');

      await task.destroy();
      assert.equal(task.getStatus(), 'destroyed');
    });

    it('emits task:destroyed when forkProcess is absent', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      let emitted = false;
      task.on('task:destroyed', () => { emitted = true; });

      await task.destroy();
      assert.isTrue(emitted);
    });

    it('transitions to stopped on stop() when forkProcess is absent', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      // Already stopped, should remain stopped without error
      await task.stop();
      assert.equal(task.getStatus(), 'stopped');
    });

    it('is a no-op when already destroyed', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      await task.destroy();
      assert.equal(task.getStatus(), 'destroyed');

      // Second destroy should not throw
      await task.destroy();
      assert.equal(task.getStatus(), 'destroyed');
    });

    it('destroys a task an kills the fork', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;

      fakeChildProcess.send.callsFake(()=>{
        task.emitter.emit('task:destroyed');
      });

      const result = await task.destroy();
      assert.isUndefined(result);
    });

    it('fails on destriy timeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;

      try {
        await task.destroy();
        assert.fail("should fail before")
      } catch (error: any){
        assert.equal(error.message, 'Destroy operation timed out');
      }
    });
  });

  describe('execute', function(){
    it('fails when call execute on stoped task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      try {
        await task.execute();
      } catch(error: any){
        assert.equal(error.message, "Cannot execute background task because it hasn't been started yet. Please initialize the task using the start() method before attempting to execute it.")
      }
    });

    it('executes a task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.callsFake((obj)=>{
        if(obj.command === 'task:execute'){
          task.emitter.emit('execution:finished', {execution: { result: "task result"}});
        } else {
          task.emitter.emit('task:started');
        }
      })

      await task.start();
      
      const result = await task.execute();
      assert.equal(result, 'task result');
    });

    it('throw error on execution fail', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.callsFake((obj)=>{
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
        assert.equal(error.message, 'task error');
      }
    });

    it('fails on execute when executeTimeout is exceeded', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { executeTimeout: 50 });

      // Only acknowledges start; never reports the execution back, so the
      // configured timeout is what ends execute().
      fakeChildProcess.send.callsFake((obj)=>{
        if(obj.command === 'task:start'){
          task.emitter.emit('task:started');
        }
      })

      await task.start();

      try {
        await task.execute();
        assert.fail("should fail before")
      } catch (error: any){
        assert.equal(error.message, 'Execution timeout exceeded');
      }
    });

    it('does not impose a timeout by default', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      // Report the result only after a delay; with no executeTimeout, execute()
      // must wait for it rather than rejecting.
      fakeChildProcess.send.callsFake((obj)=>{
        if(obj.command === 'task:execute'){
          setTimeout(() => task.emitter.emit('execution:finished', {execution: { result: "late result"}}), 50);
        } else {
          task.emitter.emit('task:started');
        }
      })

      await task.start();

      const result = await task.execute();
      assert.equal(result, 'late result');
    });
  });

  describe('introspection', function(){
    it('getPattern returns the expression', function(){
      const task = new BackgroundScheduledTask('0 0 12 * * *', './test-assets/dummy-task.js');
      assert.equal(task.getPattern(), '0 0 12 * * *');
    });

    it('match and getNextRuns compute locally (no daemon needed)', function(){
      const task = new BackgroundScheduledTask('0 0 12 * * *', './test-assets/dummy-task.js', { timezone: 'Etc/UTC' });
      assert.isTrue(task.match(new Date('2025-06-15T12:00:00Z')));
      assert.isFalse(task.match(new Date('2025-06-15T12:00:01Z')));
      const runs = task.getNextRuns(3);
      assert.lengthOf(runs, 3);
      assert.isAbove(runs[1].getTime(), runs[0].getTime());
    });

    it('runsLeft tracks executions reported by the daemon', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', { maxExecutions: 3 });
      assert.equal(task.runsLeft(), 3);
      task.emitter.emit('execution:started', {} as any);
      task.emitter.emit('execution:started', {} as any);
      assert.equal(task.runsLeft(), 1);
    });

    it('runsLeft is undefined without maxExecutions', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      assert.isUndefined(task.runsLeft());
    });

    it('isBusy is false when not executing', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      assert.isFalse(task.isBusy());
    });

    it('lastRun is null before the first execution', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      assert.isNull(task.lastRun());
    });

    it('lastRun reports the execution time and result from the daemon', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const finishedAt = new Date('2025-06-15T12:00:00.123Z');
      task.emitter.emit('execution:finished', { execution: { finishedAt, result: 'ok' } } as any);

      const last = task.lastRun();
      assert.isNotNull(last);
      assert.instanceOf(last!.date, Date);
      assert.equal(last!.date.getTime(), finishedAt.getTime());
      assert.equal(last!.result, 'ok');
      assert.isUndefined(last!.error);
    });

    it('lastRun reports the execution time and error from the daemon', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const finishedAt = new Date('2025-06-15T12:00:00.000Z');
      const error = new Error('boom');
      task.emitter.emit('execution:failed', { execution: { finishedAt, error } } as any);

      const last = task.lastRun();
      assert.isNotNull(last);
      assert.equal(last!.date.getTime(), finishedAt.getTime());
      assert.strictEqual(last!.error, error);
      assert.isUndefined(last!.result);
    });

    it('lastRun coerces an ISO-string timestamp from IPC back to a Date', function(){
      // Over IPC the execution timestamps may arrive serialized as strings.
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.emitter.emit('execution:finished', { execution: { finishedAt: '2025-06-15T12:00:00.000Z', result: 1 } } as any);

      const last = task.lastRun();
      assert.instanceOf(last!.date, Date);
      assert.equal(last!.date.toISOString(), '2025-06-15T12:00:00.000Z');
    });

    it('lastRun updates to the most recent execution', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.emitter.emit('execution:finished', { execution: { finishedAt: new Date(), result: 'first' } } as any);
      assert.equal(task.lastRun()!.result, 'first');
      task.emitter.emit('execution:finished', { execution: { finishedAt: new Date(), result: 'second' } } as any);
      assert.equal(task.lastRun()!.result, 'second');
    });

    it('lastRun falls back to startedAt when finishedAt is absent', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const startedAt = new Date('2025-06-15T12:00:00.000Z');
      task.emitter.emit('execution:finished', { execution: { startedAt, result: 'ok' } } as any);

      const last = task.lastRun();
      assert.equal(last!.date.getTime(), startedAt.getTime());
      assert.equal(last!.result, 'ok');
    });

    it('lastRun uses the current time when the execution carries no timestamp', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      const before = Date.now();
      task.emitter.emit('execution:finished', { execution: { result: 'ok' } } as any);
      const after = Date.now();

      const last = task.lastRun();
      assert.instanceOf(last!.date, Date);
      assert.isAtLeast(last!.date.getTime(), before);
      assert.isAtMost(last!.date.getTime(), after);
    });

    it('lastRun ignores a forwarded event that carries no execution', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.emitter.emit('execution:finished', {} as any);
      assert.isNull(task.lastRun());
    });

    it('msToNext is null when stopped and a positive number once started', async function(){
      const task = new BackgroundScheduledTask('* * * * *', './test-assets/dummy-task.js', { timezone: 'Etc/UTC' });
      assert.isNull(task.msToNext());

      fakeChildProcess.send.callsFake((msg: any)=>{
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
        else task.emitter.emit('task:started');
      });
      await task.start();
      const ms = task.msToNext();
      assert.isNotNull(ms);
      assert.isAbove(ms as number, 0);
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
      fakeChildProcess.send.callsFake((msg: any) => {
        if (msg.command === 'task:destroy') task.emitter.emit('task:destroyed');
        else if (msg.command === 'task:start') task.emitter.emit('task:started');
      });
      await task.start();
      return task;
    }

    const startDistributed = (coordinator: any) => startTask({ name: 'job', distributed: true, runCoordinator: coordinator });
    const replyOf = () => fakeChildProcess.send.getCalls().map(c => c.args[0]).find((a: any) => a?.type === 'coordinator:result');

    it('runs the coordinator and replies allowed:true on coordinator:shouldRun', async function () {
      const coordinator = makeCoordinator();
      const task = await startDistributed(coordinator);

      fakeChildProcess.emit('message', { type: 'coordinator:shouldRun', key: 'job:t', ttlMs: 5000, reqId: 'r1' });
      await wait(10);

      assert.deepEqual(coordinator.calls.shouldRun, [{ key: 'job:t', ttl: 5000 }]);
      const reply = replyOf();
      assert.equal(reply.reqId, 'r1');
      assert.isTrue(reply.allowed);
      assert.isUndefined(reply.error);
      await task.destroy();
    });

    it('replies allowed:false when not elected', async function () {
      const coordinator = makeCoordinator({ shouldRunReturns: false });
      const task = await startDistributed(coordinator);

      fakeChildProcess.emit('message', { type: 'coordinator:shouldRun', key: 'job:t', ttlMs: 5000, reqId: 'r2' });
      await wait(10);

      assert.isFalse(replyOf().allowed);
      await task.destroy();
    });

    it('reports a coordinator error so the daemon fails closed', async function () {
      const coordinator = makeCoordinator({ shouldRunThrows: true });
      const task = await startDistributed(coordinator);

      fakeChildProcess.emit('message', { type: 'coordinator:shouldRun', key: 'job:t', ttlMs: 5000, reqId: 'r3' });
      await wait(10);

      const reply = replyOf();
      assert.isFalse(reply.allowed);
      assert.match(reply.error, /coordinator down/);
      await task.destroy();
    });

    it('completes via the coordinator on coordinator:complete', async function () {
      const coordinator = makeCoordinator();
      const task = await startDistributed(coordinator);

      fakeChildProcess.emit('message', { type: 'coordinator:complete', key: 'job:t' });
      await wait(10);

      assert.deepEqual(coordinator.calls.onComplete, ['job:t']);
      await task.destroy();
    });

    it('replies allowed:false when no coordinator is resolved', async function () {
      // A non-distributed task has no coordinator: a stray request still gets a
      // safe (fail-closed) reply instead of hanging the daemon.
      const task = await startTask({ name: 'job' });

      fakeChildProcess.emit('message', { type: 'coordinator:shouldRun', key: 'job:t', ttlMs: 5000, reqId: 'r4' });
      await wait(10);

      assert.isFalse(replyOf().allowed);
      await task.destroy();
    });
  });
});


function wait(time: number){
  return new Promise(r=> setTimeout(r, time));
}