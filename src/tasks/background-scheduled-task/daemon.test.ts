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
      path: '../../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { name: 'dummy-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    
    assert.isDefined(task);
    assert.equal(task.name, 'dummy-task');
    task.destroy();
  });

  it('should send all events', async function () {
    messages = [];
    const message = {
      type: 'register',
      path: '../../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { name: 'dummy-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    task.start();
    
    await new Promise(r => setTimeout(() => {r(true)}, 1000));

    task.destroy();

    assert.equal(messages[0].event, 'daemon:started');
    assert.equal(messages[1].event, 'task:started');
    assert.equal(messages[2].event, 'execution:started');
    assert.equal(messages[3].event, 'execution:finished');
    assert.equal(messages[4].event, 'task:stopped');
    assert.equal(messages[5].event, 'task:destroyed');
  });

  it('should send error event', async function () {
    messages = [];
    const message = {
      type: 'register',
      path: '../../../test-assets/failing-task.js',
      cron: '* * * * * *',
      options: { name: 'failing-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    task.start();
    
    await new Promise(r => setTimeout(() => {r(true)}, 1000));

    task.destroy();

    assert.equal(messages[0].event, 'daemon:started');
    assert.equal(messages[1].event, 'task:started');
    assert.equal(messages[2].event, 'execution:started');
    assert.equal(messages[3].event, 'execution:failed');
  });

  it('should send overlap event', async function () {
    messages = [];
    const message = {
      type: 'register',
      path: '../../../test-assets/two-seconds-task.js',
      cron: '* * * * * *',
      options: { name: 'two-seconds-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    task.start();
    
    await new Promise(r => setTimeout(() => {r(true)}, 2000));

    task.destroy();

    assert.equal(messages[0].event, 'daemon:started');
    assert.equal(messages[1].event, 'task:started');
    assert.equal(messages[2].event, 'execution:started');
    assert.equal(messages[3].event, 'execution:overlap');
  }).timeout(5000);

  it('should send missed event', async function () {
    messages = [];
    const message = {
      type: 'register',
      path: '../../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { name: 'missed-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    task.start();
    
    await new Promise(resolve => { setTimeout(resolve, 1000)});
    blockIO(2000);
    await new Promise(resolve => { setTimeout(resolve, 1200)});


    task.destroy();

    const event = messages.find(m => m.event === 'execution:missed')
    assert.isDefined(event);
  }).timeout(6000);
});

function blockIO(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms) {
  }
}
