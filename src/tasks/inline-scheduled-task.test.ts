import { InlineScheduledTask } from './inline-scheduled-task';
import { TaskContext } from './scheduled-task';

describe('InlineScheduledTask', function() {
  it('builds with default values', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});

   expect(task.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
   expect(task.id).toBe(task.name);
   expect(task.runner).toBeDefined();
   expect(task.getStatus()).toBe('stopped')
  });

  it('starts', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});
    task.start();
    expect(task.getStatus()).toBe('idle');
    task.destroy();
  });

  it('returns next run', function(){
    const task = new InlineScheduledTask('* * * * *', ()=> {});
    task.start();

    const nextMinute = new Date();
    nextMinute.setMilliseconds(0);
    nextMinute.setSeconds(0);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);

    expect(task.getNextRun()?.getTime()).toBe(nextMinute.getTime());
    task.destroy();
  });

  it('stops', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});
    task.start();
    expect(task.getStatus()).toBe('idle');
    task.stop();
    expect(task.getStatus()).toBe('stopped');
    task.destroy();
  });

  it('destroys', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});
    task.start();
    expect(task.getStatus()).toBe('idle');
    task.destroy();
    expect(task.getStatus()).toBe('destroyed');
  });

  it('executes', async function(){
    const task = new InlineScheduledTask('* * * * * *', async () => { return "task result" });
    const result = await task.execute();
    expect(result).toBe("task result");
  });

  it('executes and fails', async function(){
    const task = new InlineScheduledTask('* * * * * *', async ()=> { throw new Error("task error") });
    try{
      await task.execute();
      expect.fail('should fail before')
    } catch(error: any){
      expect(error.message).toBe('task error')
    }
  });

  it('execute() removes execution:finished listener after failure', async function(){
    const task = new InlineScheduledTask('* * * * * *', async () => {
      throw new Error('fail');
    });
    try { await task.execute(); } catch { /* expected */ }
    expect(task.emitter.listenerCount('execution:finished')).toBe(0);
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
    expect(event?.date).toBeDefined()
    expect(event?.triggeredAt).toBeDefined()
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
    expect(event?.date).toBeDefined()
    expect(event?.triggeredAt).toBeDefined()
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
    expect(event?.date).toBeDefined()
    expect(event?.triggeredAt).toBeDefined()
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
    expect(event?.date).toBeDefined()
    expect(event?.triggeredAt).toBeDefined()
    expect(event?.execution).toBeDefined()
    expect(event?.execution!.id).toBeDefined()
    expect(event?.execution!.result).toBeUndefined()
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
    expect(event?.date).toBeDefined()
    expect(event?.triggeredAt).toBeDefined()
    expect(event?.execution).toBeDefined()
    expect(event?.execution!.id).toBeDefined()
    expect(event?.execution!.result).toBeDefined()
    expect(event?.execution!.error).toBeUndefined()
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
    expect(event?.date).toBeDefined()
    expect(event?.triggeredAt).toBeDefined()
    expect(event?.execution).toBeDefined()
    expect(event?.execution!.id).toBeDefined()
    expect(event?.execution!.result).toBeUndefined()
    expect(event?.execution!.error).toBeDefined()
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
    expect(event?.date).toBeDefined()
    expect(event?.triggeredAt).toBeDefined()
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
    expect(event?.date).toBeDefined()
    expect(event?.triggeredAt).toBeDefined()
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
    expect(event?.date).toBeDefined()
    expect(event?.triggeredAt).toBeDefined()
    task.destroy();
  });

  it('routes execution errors to the task logger', async function(){
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => { throw new Error('boom'); }, { logger: captured });
    try { await task.execute(); } catch { /* execute() rejects on failure */ }
    expect(captured.errors.length).toBe(1);
    task.destroy();
  });

  it('warns about missed execution via the task logger when unhandled', async function(){
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => {}, { logger: captured });
    task.start();
    await wait(1000); blockIO(2000); await wait(1200);
    expect(captured.warnings.some(w => w.includes('missed execution'))).toBe(true);
    task.destroy();
  });

  it('suppresses the missed-execution warning when execution:missed has a listener', async function(){
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => {}, { logger: captured });
    let missedFired = false;
    task.on('execution:missed', () => { missedFired = true; });
    task.start();
    await wait(1000); blockIO(2000); await wait(1200);
    expect(missedFired).toBe(true);
    expect(captured.warnings.some(w => w.includes('missed execution'))).toBe(false);
    task.destroy();
  });

  it('suppresses the missed-execution warning when suppressMissedWarning is set', async function(){
    // Same timing as the "when unhandled" test, which reliably produces a missed
    // execution; the only difference here is the suppressMissedWarning flag.
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => {}, { logger: captured, suppressMissedWarning: true });
    task.start();
    await wait(1000); blockIO(2000); await wait(1200);
    expect(captured.warnings.some(w => w.includes('missed execution'))).toBe(false);
    task.destroy();
  });

  it('start() after destroy() is a no-op and does not arm the runner', async function(){
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => {}, { logger: captured });
    task.destroy();
    task.start();
    expect(task.runner.isStopped()).toBe(true);
    expect(task.getStatus()).toBe('destroyed');
    await wait(1200);
    expect(captured.errors.length).toBe(0);
  });

  it('stop() after destroy() is a no-op', function(){
    const task = new InlineScheduledTask('* * * * * *', ()=> {});
    task.destroy();
    task.stop();
    expect(task.getStatus()).toBe('destroyed');
  });

  it('execute() resolves with the invoked run\'s own result, not a concurrent scheduled run\'s', async function(){
    const task = new InlineScheduledTask('* * * * * *', async (ctx) => {
      if (ctx.execution?.reason === 'invoked') {
        await wait(1500);
        return 'invoked';
      }
      return 'scheduled';
    });

    task.start();
    const result = await task.execute();
    task.destroy();

    expect(result).toBe('invoked');
  });

  it('execute() ignores a concurrent scheduled run\'s failure while the invoked run is still in flight', async function(){
    const task = new InlineScheduledTask('* * * * * *', async (ctx) => {
      if (ctx.execution?.reason === 'invoked') {
        await wait(1500);
        return 'invoked';
      }
      throw new Error('scheduled boom');
    });
    task.on('execution:failed', () => {});

    task.start();
    const result = await task.execute();
    task.destroy();

    expect(result).toBe('invoked');
  });

  it('a throwing execution:finished listener does not reclassify the run as failed', async function(){
    const task = new InlineScheduledTask('* * * * * *', async () => 'ok');
    let failedFired = false;
    task.on('execution:failed', () => { failedFired = true; });
    task.on('execution:finished', () => { throw new Error('listener boom'); });

    const result = await task.execute();

    expect(result).toBe('ok');
    expect(failedFired).toBe(false);
    expect(task.lastRun()?.result).toBe('ok');
    expect(task.lastRun()?.error).toBeUndefined();
  });

  it('an async execution:finished listener that rejects does not crash the process', async function(){
    const captured = makeLogger();
    const task = new InlineScheduledTask('* * * * * *', async () => 'ok', { logger: captured });
    task.on('execution:finished', async () => { throw new Error('async listener boom'); });

    const result = await task.execute();
    await wait(20);

    expect(result).toBe('ok');
    expect(captured.errors.length).toBeGreaterThan(0);
  });

  it('manual execute() does not count toward maxExecutions or get blocked by it', async function(){
    const task = new InlineScheduledTask('* * * * * *', async () => 'ok', { maxExecutions: 2 });

    await task.execute();
    await task.execute();
    await task.execute();

    expect(task.runsLeft()).toBe(2);
    expect(task.getStatus()).not.toBe('destroyed');
  });

  it('two scheduled fires still stop the task at maxExecutions, and execute() still runs after', async function(){
    const task = new InlineScheduledTask('* * * * * *', async () => 'ok', { maxExecutions: 2 });
    const maxReached = new Promise<void>(resolve => task.on('execution:maxReached', () => resolve()));

    task.start();
    await maxReached;

    expect(task.getStatus()).toBe('destroyed');
    expect(task.runsLeft()).toBe(0);

    const result = await task.execute();
    expect(result).toBe('ok');
    expect(task.runsLeft()).toBe(0);
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