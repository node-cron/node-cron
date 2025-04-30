import { assert } from 'chai';
import { bind } from './daemon';

describe('daemon - register', function () {
  let messages: any[] = [];
  let listeners: any[] = [];

  beforeEach(() => {
    process.send = (message: any) => {
      messages.push(message);
      return true;
    }
    process.on = (event, fn) => {
      listeners.push({ event, fn });
      return process;
    };
  });

  it('should register a task', async function () {
    const message = {
      type: 'register',
      path: '../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { scheduled: true, name: 'dummy-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    
    assert.isDefined(task);
    assert.equal(task.options.name, 'dummy-task');
    task.destroy();
  });

  it('should send all events', async function () {
    messages = [];
    const message = {
      type: 'register',
      path: '../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { scheduled: false, name: 'dummy-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    task.start();
    
    await new Promise(r => setTimeout(() => {r(true)}, 1200));

    task.destroy();
    assert.equal(messages[0].type, 'registred');
    assert.equal(messages[1].type, 'scheduler-started');
    assert.equal(messages[2].type, 'task-started');
    assert.equal(messages[3].type, 'task-done');
    assert.equal(messages[4].type, 'scheduler-stopped');
    assert.equal(messages[5].type, 'scheduler-destroyed');
  })
});
