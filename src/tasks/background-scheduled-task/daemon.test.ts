import { assert } from 'chai';
import { bind } from './daemon';
import { IpcRunCoordinator } from '../../coordinator/ipc-run-coordinator';

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

  it('wires an IPC run coordinator when the task is distributed', async function () {
    const message = {
      command: 'task:start',
      path: '../../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { name: 'distributed-task', distributed: true },
    };

    bind();
    const onMessage = listeners.find(l => l.event === 'message');
    const task: any = await onMessage.fn(message);

    assert.instanceOf(task.runner.runCoordinator, IpcRunCoordinator);
    task.destroy();
  });

  it('forwards execution:skipped with its reason when the coordinator declines', async function () {
    messages = [];
    const message = {
      command: 'task:start',
      path: '../../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { name: 'distributed-task', distributed: true },
    };

    bind();
    const onMessage = listeners.find(l => l.event === 'message');
    const task: any = await onMessage.fn(message);

    // The daemon's IpcRunCoordinator asks the parent over IPC and waits for a
    // reply. Wait (event-gated, not a fixed sleep) for the ask, reply "not
    // elected", then wait for the forwarded skip.
    const ask = await waitFor(() => messages.find(m => m?.type === 'coordinator:shouldRun'));
    assert.isDefined(ask, 'daemon should ask the parent whether to run');
    listeners
      .filter(l => l.event === 'message')
      .forEach(l => l.fn({ type: 'coordinator:result', reqId: ask.reqId, allowed: false }));

    const skipped = await waitFor(() => messages.find(m => m.event === 'execution:skipped'));
    assert.isDefined(skipped, 'daemon should forward execution:skipped');
    assert.equal(skipped.context.reason, 'not-elected');
    task.destroy();
  });

  it('exits when the parent disconnects (does not linger as an orphan)', function () {
    const realExit = process.exit;
    let exitedWith: number | undefined;
    (process as any).exit = (code?: number) => { exitedWith = code; };
    try {
      bind();
      const disconnect = listeners.filter(l => l.event === 'disconnect').pop();
      assert.isDefined(disconnect, 'daemon should listen for parent disconnect');
      disconnect.fn();
      assert.equal(exitedWith, 0);
    } finally {
      process.exit = realExit;
    }
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

  it('serializes task state field as "state" in messages', async function () {
    messages = [];
    const message = {
      command: 'task:start',
      path: '../../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { name: 'dummy-task' },
    };

    bind();
    const onMessage = listeners.find(l => l.event === 'message');
    const task = await onMessage.fn(message);
    task.start();

    await new Promise(r => setTimeout(r, 1000));
    task.destroy();

    const started = messages.find(m => m.event === 'execution:started');
    assert.isDefined(started, 'execution:started should be sent');
    assert.isDefined(started.context.task.state, 'task field should use "state" not "status"');
    assert.isUndefined(started.context.task.status, 'task field should not use "status"');
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

// Polls `get` until it returns a truthy value or the timeout elapses, instead
// of sleeping a fixed amount and hoping the (real-timer) fire already happened.
async function waitFor<T>(get: () => T, timeout = 3000, interval = 25): Promise<T> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = get();
    if (value || Date.now() > deadline) return value;
    await new Promise(r => setTimeout(r, interval));
  }
}
