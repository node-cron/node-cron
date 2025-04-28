import { assert } from 'chai';
import sinon from 'sinon';
import { register, bind } from './daemon.js';

describe('daemon.js - register', function () {
  let messages = [];
  let listeners = [];

  beforeEach(() => {
    process.send = (message) => {
      messages.push(message);
    }
    process.on = (event, fn) => {
      listeners.push({ event, fn });
    };
  });

  it('should register a task', async function () {
    const message = {
      type: 'register',
      path: '../test-assets/dummy-task.js',
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
      path: '../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { scheduled: true, name: 'dummy-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    task.start();
    
    setTimeout(() => {
      task.destroy();
      assert.equal(messages[0].type, 'registred');
      assert.equal(messages[1].type, 'scheduler-started');
      assert.equal(messages[2].type, 'task-started');
      assert.equal(messages[3].type, 'task-done');
      assert.equal(messages[4].type, 'scheduler-stopped');
      assert.equal(messages[5].type, 'scheduler-destroyed');
    }, 1000);
  })
});
