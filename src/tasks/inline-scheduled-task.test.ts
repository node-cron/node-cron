import { assert } from 'chai';

import { InlineScheduledTask } from './inline-scheduled-task.js';

import type { TaskContext } from './scheduled-task.js';

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
  }).timeout(5000);

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
  }).timeout(5000);
});

function blockIO(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms);
}
