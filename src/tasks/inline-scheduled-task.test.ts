import { assert } from 'chai';
import { InlineScheduledTask } from './inline-scheduled-task';
import { TaskContext } from './scheduled-task';

describe('InlineScheduledTask', function() {
  it('builds with default values', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});

   assert.isTrue(task.id.startsWith('task-'));
   assert.equal(task.id, task.name);
   assert.isDefined(task.runner);
   assert.equal(task.getStatus(), 'stopped')
  });

  it('starts', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});
    task.start();
    assert.equal(task.getStatus(), 'idle');
    task.destroy();
  });

  it('returns next run', function(){
    const task = new InlineScheduledTask('* * * * *', ()=> {});
    task.start();

    const nextMinute = new Date();
    nextMinute.setMilliseconds(0);
    nextMinute.setSeconds(0);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);

    assert.equal(task.getNextRun()?.getTime(), nextMinute.getTime());
    task.destroy();
  });

  it('stops', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});
    task.start();
    assert.equal(task.getStatus(), 'idle');
    task.stop();
    assert.equal(task.getStatus(), 'stopped');
    task.destroy();
  });

  it('destroys', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});
    task.start();
    assert.equal(task.getStatus(), 'idle');
    task.destroy();
    assert.equal(task.getStatus(), 'destroyed');
  });

  it('executes', async function(){
    const task = new InlineScheduledTask('* * * * * *', async () => { return "task result" });
    const result = await task.execute();
    assert.equal(result, "task result");
  });

  it('executes and fails', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> { throw new Error("task error") });
    try{
      await task.execute();
      assert.fail('should fail before')
    } catch(error: any){
      assert.equal(error.message, 'task error')
    }
  });

  it('execute() removes execution:finished listener after failure', async function(){
    const task = new InlineScheduledTask('* * * * * *', async () => {
      throw new Error('fail');
    });
    try { await task.execute(); } catch { /* expected */ }
    assert.equal(task.emitter.listenerCount('execution:finished'), 0);
    task.destroy();
  });

  it('emmits task:started', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> { return "task result" });
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('task:started', (event)=> {
        resolve(event);
      })
    });
    task.start();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    task.destroy();
  });

  it('emmits task:stopped', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> { return "task result" });
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('task:stopped', (event)=> {
        resolve(event);
      })
    });
    task.start();
    task.stop();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    task.destroy();
  });

  it('emmits task:destroyed', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> { return "task result" });
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('task:destroyed', (event)=> {
        resolve(event);
      })
    });
    task.destroy();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
  });

  it('emmits execution:started', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> { return "task result" });
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:started', (event)=> {
        resolve(event);
      })
    });
    task.start();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    assert.isDefined(event?.execution)
    assert.isDefined(event?.execution.id)
    assert.isUndefined(event?.execution.result)
    task.destroy();
  });

  it('emmits execution:finished', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> { return "task result" });
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:finished', (event)=> {
        resolve(event);
      })
    });
    task.start();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    assert.isDefined(event?.execution)
    assert.isDefined(event?.execution.id)
    assert.isDefined(event?.execution.result)
    assert.isUndefined(event?.execution.error)
    task.destroy();
  });

  it('emmits execution:failed', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> { throw new Error("task result") });
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:failed', (event)=> {
        resolve(event);
      })
    });
    task.start();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    assert.isDefined(event?.execution)
    assert.isDefined(event?.execution.id)
    assert.isUndefined(event?.execution.result)
    assert.isDefined(event?.execution.error)
    task.destroy();
  });

  it('emmits execution:overlap', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> { await new Promise(r => setTimeout(r, 2000))});
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:overlap', (event)=> {
        resolve(event);
      })
    });
    task.start();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    task.destroy();
  });

  it('emmits execution:missed', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> {  return "task result" });
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:missed', (event)=> {
        resolve(event);
      })
    });
    task.start();

    await new Promise(resolve => { setTimeout(resolve, 1000)});
    blockIO(2000);
    await new Promise(resolve => { setTimeout(resolve, 1200)});

    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    task.destroy();
  });

  it('emmits execution:maxReached', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> {  return "task result" }, { maxExecutions: 1 });
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:maxReached', (event)=> {
        resolve(event);
      })
    });
    task.start();

    await new Promise(resolve => { setTimeout(resolve, 1000)});

    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    task.destroy();
  });

  it('routes execution errors to the task logger', async function(){
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => { throw new Error('boom'); }, { logger: captured });
    try { await task.execute(); } catch { /* execute() rejects on failure */ }
    assert.equal(captured.errors.length, 1, 'task logger should receive the error');
    task.destroy();
  });

  it('warns about missed execution via the task logger when unhandled', async function(){
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => {}, { logger: captured });
    task.start();
    await wait(1000); blockIO(2000); await wait(1200);
    assert.isTrue(captured.warnings.some(w => w.includes('missed execution')), 'expected a missed-execution warning');
    task.destroy();
  });

  it('suppresses the missed-execution warning when execution:missed has a listener', async function(){
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => {}, { logger: captured });
    let missedFired = false;
    task.on('execution:missed', () => { missedFired = true; });
    task.start();
    await wait(1000); blockIO(2000); await wait(1200);
    assert.isTrue(missedFired, 'a missed execution should have occurred');
    assert.isFalse(captured.warnings.some(w => w.includes('missed execution')), 'warning should be suppressed when handled');
    task.destroy();
  });

  it('suppresses the missed-execution warning when suppressMissedWarning is set', async function(){
    // Same timing as the "when unhandled" test, which reliably produces a missed
    // execution; the only difference here is the suppressMissedWarning flag.
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => {}, { logger: captured, suppressMissedWarning: true });
    task.start();
    await wait(1000); blockIO(2000); await wait(1200);
    assert.isFalse(captured.warnings.some(w => w.includes('missed execution')), 'warning should be suppressed by the flag');
    task.destroy();
  });

  it('calls onError when the task throws synchronously', async function(){
    let received: { error: Error; context: TaskContext } | undefined;
    const task = new InlineScheduledTask('* * * * * *', () => { throw new Error('sync boom'); }, {
      onError: (error, context) => { received = { error, context }; }
    });
    try { await task.execute(); } catch { /* execute() rejects on failure */ }
    assert.isDefined(received, 'onError should be called');
    assert.equal(received?.error.message, 'sync boom');
    task.destroy();
  });

  it('calls onError when the task rejects asynchronously', async function(){
    let received: { error: Error; context: TaskContext } | undefined;
    const task = new InlineScheduledTask('* * * * * *', async () => { throw new Error('async boom'); }, {
      onError: (error, context) => { received = { error, context }; }
    });
    try { await task.execute(); } catch { /* execute() rejects on failure */ }
    assert.isDefined(received, 'onError should be called');
    assert.equal(received?.error.message, 'async boom');
    task.destroy();
  });

  it('passes the error and an execution context to onError', async function(){
    let received: { error: Error; context: TaskContext } | undefined;
    const task = new InlineScheduledTask('* * * * * *', async () => { throw new Error('ctx boom'); }, {
      onError: (error, context) => { received = { error, context }; }
    });
    try { await task.execute(); } catch { /* expected */ }
    assert.isDefined(received);
    assert.instanceOf(received?.error, Error);
    assert.isDefined(received?.context.date);
    assert.isDefined(received?.context.triggeredAt);
    assert.isDefined(received?.context.execution);
    assert.isDefined(received?.context.execution?.id);
    assert.equal(received?.context.execution?.error?.message, 'ctx boom');
    assert.equal(received?.context.task, task);
    task.destroy();
  });

  it('still emits execution:failed alongside onError', async function(){
    let onErrorCalled = false;
    let eventFired = false;
    const task = new InlineScheduledTask('* * * * * *', async () => { throw new Error('both'); }, {
      onError: () => { onErrorCalled = true; }
    });
    task.on('execution:failed', () => { eventFired = true; });
    try { await task.execute(); } catch { /* expected */ }
    assert.isTrue(onErrorCalled, 'onError should be called');
    assert.isTrue(eventFired, 'execution:failed should still fire');
    task.destroy();
  });

  it('keeps current behavior when onError is absent', async function(){
    let eventFired = false;
    const task = new InlineScheduledTask('* * * * * *', async () => { throw new Error('no callback'); });
    task.on('execution:failed', () => { eventFired = true; });
    try { await task.execute(); } catch { /* expected */ }
    assert.isTrue(eventFired, 'execution:failed should still fire without onError');
    task.destroy();
  });

  it('does not crash the scheduler when onError itself throws', async function(){
    const captured = makeLogger();
    let eventFired = false;
    const task = new InlineScheduledTask('* * * * * *', async () => { throw new Error('original'); }, {
      logger: captured,
      onError: () => { throw new Error('callback exploded'); }
    });
    task.on('execution:failed', () => { eventFired = true; });
    // execute() must still reject with the original error, not the callback error,
    // and the throwing callback must not propagate.
    let rejected: Error | undefined;
    try { await task.execute(); } catch (e: any) { rejected = e; }
    assert.equal(rejected?.message, 'original');
    assert.isTrue(eventFired, 'execution:failed should still fire');
    assert.isTrue(captured.errors.some(e => typeof e === 'string' && e.includes('onError callback threw')), 'the thrown callback error should be logged, not propagated');
    task.destroy();
  });
});

function makeLogger(){
  const warnings: string[] = [];
  const errors: any[] = [];
  return {
    warnings,
    errors,
    info(){},
    warn(m: string){ warnings.push(m); },
    error(m: string | Error){ errors.push(m); },
    debug(){},
  };
}

function wait(ms: number){
  return new Promise(resolve => setTimeout(resolve, ms));
}

function blockIO(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms);
}