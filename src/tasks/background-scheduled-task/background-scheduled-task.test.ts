import { assert } from 'chai';
import BackgroundScheduledTask from "./background-scheduled-task";

import { TaskContext } from '../scheduled-task';
import { TaskRegistry } from 'src/task-registry';

describe('BackgroundScheduledTask', function() {
  this.timeout(10000);

  it('builds with default values', function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

   assert.isTrue(task.id.startsWith('task-'));
   assert.equal(task.id, task.name);
   assert.equal(task.getStatus(), 'stopped');
  });

  it('starts', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    await task.start();
    // assert.equal(task.getStatus(), 'idle');
    await task.destroy();
  });

  it('stops', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    await task.start();
    assert.equal(task.getStatus(), 'idle');
    await task.stop();
    assert.equal(task.getStatus(), 'stopped');
    await task.destroy();
  });

  it('destroys', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    await task.start();
    assert.equal(task.getStatus(), 'idle');
    await task.destroy();
    assert.equal(task.getStatus(), 'destroyed');
  });

  it('executes', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    await task.start();
    const result = await task.execute();
    assert.equal(result, "dummy task");
    await task.destroy();
  });

  it('fails on execute stopped task', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    try{
      await task.execute();
      assert.fail('shoud fail before');
    } catch(error: any){
      assert.equal(error.message, 'Cannot execute background task because it hasn\'t been started yet. Please initialize the task using the start() method before attempting to execute it.')
    }
    await task.destroy();
  });

  it('executes and fails', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/failing-task.js');
    try{
      await task.start();
      await task.execute();
      assert.fail('should fail before')
    } catch(error: any){
      assert.equal(error.message, 'failed task');
      await task.destroy();
    }
  });

  it('emmits task:started', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('task:started', (event)=> {
        resolve(event);
      })
    });
    await task.start();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    await task.destroy();
  });

  it('emmits task:stopped', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('task:stopped', (event)=> {
        resolve(event);
      })
    });
    await task.start();
    await task.stop();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    task.destroy();
  });

  it('does not fail on stop stopped task', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    try{
      const result = await task.stop();
      assert.isUndefined(result);
    } catch(error: any){
      assert.fail('it should work');
    }
    await task.destroy();
  });

  it('emmits task:destroyed', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('task:destroyed', (event)=> {
        resolve(event);
      })
    });
    await task.start();
    await task.destroy();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
  });

  it('emmits execution:started', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:started', (event)=> {
        resolve(event);
      })
    });

    await task.start();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    assert.isDefined(event?.execution)
    assert.isDefined(event?.execution.id)
    assert.isUndefined(event?.execution.result)
    await task.destroy();
  }).timeout(10000);

  it('emmits execution:finished', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:finished', (event)=> {
        resolve(event);
      })
    });
    await task.start();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    assert.isDefined(event?.execution)
    assert.isDefined(event?.execution.id)
    assert.isDefined(event?.execution.result)
    assert.isUndefined(event?.execution.error)
    await task.destroy();
  }).timeout(10000);

  it('emmits execution:failed', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/failing-task.js');
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:failed', (event)=> {
        resolve(event);
      })
    });
    await task.start();
    const event = await eventCaught;

    const err: any = event?.execution?.error;

    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    assert.isDefined(event?.execution)
    assert.isDefined(event?.execution.id)
    assert.isUndefined(event?.execution.result)
    assert.isDefined(err)
    assert.equal(err.extra, 'extra');
    await task.destroy();
  }).timeout(10000);

  it('emmits execution:overlap', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/two-seconds-task.js');
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:overlap', (event)=> {
        resolve(event);
      })
    });
    await task.start();
    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    task.destroy();
  }).timeout(10000);

  it('emmits execution:missed', async function(){
    const task = new BackgroundScheduledTask('* * * * * *', './test-assets/blocking-task.js');
    const eventCaught = new Promise<TaskContext>(resolve => {
      task.on('execution:missed', (event)=> {
        resolve(event);
      })
    });
    await task.start();

    const event = await eventCaught;
    assert.isDefined(event?.date)
    assert.isDefined(event?.triggeredAt)
    await task.destroy();
  }).timeout(10000);
});
