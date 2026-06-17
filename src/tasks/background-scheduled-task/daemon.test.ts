import { assert } from 'chai';
import { bind } from './daemon';
import { IpcLockProvider } from '../../lock/ipc-lock-provider';

describe('daemon - register', function () {
  let messages: any[] = [];
  const listeners: any[] = [];

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
      command: 'task:start',
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

  it('wires an IPC lock provider when the task uses lock', async function () {
    const message = {
      command: 'task:start',
      path: '../../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { name: 'locked-task', lock: true },
    };

    bind();
    const onMessage = listeners.find(l => l.event === 'message');
    const task: any = await onMessage.fn(message);

    assert.instanceOf(task.runner.lockProvider, IpcLockProvider);
    task.destroy();
  });

  it('should send all events', async function () {
    messages = [];
    const message = {
      command: 'task:start',
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

    const expectedEvents = [
      'daemon:started',
      'task:started',
      'execution:started',
      'execution:finished',
      'task:stopped',
      'task:destroyed'
    ];
  
    const receivedEvents = messages.map(msg => msg.event);
    expectedEvents.forEach(expectedEvent => {
      assert.ok(
        receivedEvents.includes(expectedEvent), 
        `Event '${expectedEvent}' not received. Events received: ${receivedEvents.join(', ')}`
      );
    });
  });

  it('should send error event', async function () {
    messages = [];
    const message = {
      command: 'task:start',
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

    assert.isDefined(messages.find(m => m.event === 'daemon:started'), 'daemon:started should be sent');
    assert.isDefined(messages.find(m => m.event === 'task:started'), 'task:started should be sent');
    assert.isDefined(messages.find(m => m.event === 'execution:started'), 'execution:started should be sent');
    assert.isDefined(messages.find(m => m.event === 'execution:failed'), 'execution:failed should be sent');
  });

  it('should send overlap event', async function () {
    messages = [];
    const message = {
      command: 'task:start',
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

    assert.isDefined(messages.find(m => m.event === 'daemon:started'), 'daemon:started should be sent');
    assert.isDefined(messages.find(m => m.event === 'task:started'), 'task:started should be sent');
    assert.isDefined(messages.find(m => m.event === 'execution:started'), 'execution:started should be sent');
    assert.isDefined(messages.find(m => m.event === 'execution:overlap'), 'execution:overlap should be sent');
  });

  it('should send missed event', async function () {
    messages = [];
    const message = {
      command: 'task:start',
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
  });

  it('should handle task:stop command', async function () {
    messages = [];
    const message = {
      command: 'task:start',
      path: '../../../test-assets/two-seconds-task.js',
      cron: '* * * * * *',
      options: { name: 'two-seconds-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    await task.start();
    
    const onMessage = listeners.find(l => l.event === 'message');
    const stopMessage = { command: 'task:stop' };
    const result = await onMessage.fn(stopMessage);
    
    assert.equal(result, task);
    
    const stoppedEvent = messages.find(m => m.event === 'task:stopped');
    assert.isDefined(stoppedEvent, 'task:stopped event should be sent');
    task.destroy();
  });

  it('should handle task:destroy command', async function () {
    messages = [];
    const message = {
      command: 'task:start',
      path: '../../../test-assets/two-seconds-task.js',
      cron: '* * * * * *',
      options: { name: 'two-seconds-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    await task.start();

    const onMessage = listeners.find(l => l.event === 'message');
    const destroyMessage = { command: 'task:destroy' };
    const result = await onMessage.fn(destroyMessage);
    
    assert.equal(result, task);
    
    const destroyedEvent = messages.find(m => m.event === 'task:destroyed');
    assert.isDefined(destroyedEvent, 'task:destroyed event should be sent');
    task.destroy();
  });

  it('should handle task:execute command', async function () {
    messages = [];
    const message = {
      command: 'task:start',
      path: '../../../test-assets/two-seconds-task.js',
      cron: '* * * * * *',
      options: { name: 'two-seconds-task' },
    };
  
    bind();
    const onMessge = listeners.find(l => l.event === 'message');
    const task = await onMessge.fn(message);
    await task.start();
    
    const onMessage = listeners.find(l => l.event === 'message');
    const executeMessage = { command: 'task:execute' };
    await onMessage.fn(executeMessage);
    
    const startedEvent = messages.find(m => m.event === 'execution:started');
    assert.isDefined(startedEvent, 'execution:started event should be sent');
    
    const finishedEvent = messages.find(m => m.event === 'execution:finished');
    assert.isDefined(finishedEvent, 'execution:finished event should be sent');
    task.destroy();
  });;

  it('should handle task:execute command with error', async function () {
    const message = {
      command: 'task:start',
      path: '../../../test-assets/failing-task.js',
      cron: '* * * * * *',
      options: { name: 'failing-task' },
    };
  
    bind();
    const onMessage = listeners.find(l => l.event === 'message');
    const task = await onMessage.fn(message);
    await task.start();
    
    messages = [];
    
    const executeMessage = { command: 'task:execute' };
    await onMessage.fn(executeMessage);

    const failedEvent = messages.find(m => m.event === 'execution:failed');    
    assert.isDefined(failedEvent, 'execution:failed event should be sent');
    assert.isDefined(failedEvent.jsonError, 'error should be serialized');
    assert.equal(JSON.parse(failedEvent.jsonError).extra, 'extra');
    task.destroy();
  });

  it('forwards the real load error to the parent instead of crashing', async function () {
    messages = [];
    const message = {
      command: 'task:start',
      path: '/does/not/exist-484-xyz.ts',
      cron: '* * * * * *',
      options: {},
    };

    bind();
    const onMessage = listeners.find(l => l.event === 'message');

    // The handler must not throw/reject: a failed import is reported, not crashed.
    let threw = false;
    try {
      await onMessage.fn(message);
    } catch {
      threw = true;
    }
    assert.isFalse(threw, 'daemon should not throw when the task fails to load');

    const errorMessage = messages.find(m => m.event === 'daemon:error');
    assert.isDefined(errorMessage, 'daemon should send a daemon:error message');
    assert.isDefined(errorMessage.jsonError, 'the real error should be serialized');
    assert.match(JSON.parse(errorMessage.jsonError).message, /exist-484-xyz|find|module/i);
  });
});

function blockIO(ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms);
}
