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
    
    expect(task).toBeDefined();
    expect(task.name).toBe('dummy-task');
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

    expect(task.runner.runCoordinator).toBeInstanceOf(IpcRunCoordinator);
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
    expect(ask).toBeDefined();
    listeners
      .filter(l => l.event === 'message')
      .forEach(l => l.fn({ type: 'coordinator:result', reqId: ask.reqId, allowed: false }));

    const skipped = await waitFor(() => messages.find(m => m.event === 'execution:skipped'));
    expect(skipped).toBeDefined();
    expect(skipped.context.reason).toBe('not-elected');
    task.destroy();
  });

  it('exits when the parent disconnects (does not linger as an orphan)', function () {
    const realExit = process.exit;
    let exitedWith: number | undefined;
    (process as any).exit = (code?: number) => { exitedWith = code; };
    try {
      bind();
      const disconnect = listeners.filter(l => l.event === 'disconnect').pop();
      expect(disconnect).toBeDefined();
      disconnect.fn();
      expect(exitedWith).toBe(0);
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
      expect(receivedEvents.includes(expectedEvent)).toBeTruthy();
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

    expect(messages.find(m => m.event === 'daemon:started')).toBeDefined();
    expect(messages.find(m => m.event === 'task:started')).toBeDefined();
    expect(messages.find(m => m.event === 'execution:started')).toBeDefined();
    expect(messages.find(m => m.event === 'execution:failed')).toBeDefined();
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

    expect(messages.find(m => m.event === 'daemon:started')).toBeDefined();
    expect(messages.find(m => m.event === 'task:started')).toBeDefined();
    expect(messages.find(m => m.event === 'execution:started')).toBeDefined();
    expect(messages.find(m => m.event === 'execution:overlap')).toBeDefined();
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
    expect(event).toBeDefined();
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
    
    expect(result).toBe(task);

    const stoppedEvent = messages.find(m => m.event === 'task:stopped');
    expect(stoppedEvent).toBeDefined();
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
    
    expect(result).toBe(task);

    const destroyedEvent = messages.find(m => m.event === 'task:destroyed');
    expect(destroyedEvent).toBeDefined();
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
    expect(started).toBeDefined();
    expect(started.context.task.state).toBeDefined();
    expect(started.context.task.status).toBeUndefined();
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
    expect(startedEvent).toBeDefined();

    const finishedEvent = messages.find(m => m.event === 'execution:finished');
    expect(finishedEvent).toBeDefined();
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
    expect(failedEvent).toBeDefined();
    expect(failedEvent.jsonError).toBeDefined();
    expect(JSON.parse(failedEvent.jsonError).extra).toBe('extra');
    task.destroy();
  });

  it('task:stop is safe when no task has been started', async function () {
    bind();
    const onMessage = listeners.filter(l => l.event === 'message').pop();
    const result = await onMessage.fn({ command: 'task:stop' });
    expect(result).toBeUndefined();
  });

  it('task:destroy is safe when no task has been started', async function () {
    bind();
    const onMessage = listeners.filter(l => l.event === 'message').pop();
    const result = await onMessage.fn({ command: 'task:destroy' });
    expect(result).toBeUndefined();
  });

  it('task:execute is safe when no task has been started', async function () {
    bind();
    const onMessage = listeners.filter(l => l.event === 'message').pop();
    const result = await onMessage.fn({ command: 'task:execute' });
    expect(result).toBeUndefined();
  });

  it('starts a daemon without options', async function () {
    const message = {
      command: 'task:start',
      path: '../../../test-assets/dummy-task.js',
      cron: '* * * * * *',
    };

    bind();
    const onMessage = listeners.filter(l => l.event === 'message').pop();
    const task = await onMessage.fn(message);

    expect(task).toBeDefined();
    task.destroy();
  });

  it('sendEvent does not crash when process.send is undefined', async function () {
    const message = {
      command: 'task:start',
      path: '../../../test-assets/dummy-task.js',
      cron: '* * * * * *',
      options: { name: 'dummy-task' },
    };

    bind();
    const onMessage = listeners.filter(l => l.event === 'message').pop();
    const task = await onMessage.fn(message);

    const savedSend = process.send;
    process.send = undefined as any;

    task.start();
    await new Promise(r => setTimeout(r, 1000));

    process.send = savedSend;
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
    expect(threw).toBe(false);

    const errorMessage = messages.find(m => m.event === 'daemon:error');
    expect(errorMessage).toBeDefined();
    expect(errorMessage.jsonError).toBeDefined();
    expect(JSON.parse(errorMessage.jsonError).message).toMatch(/exist-484-xyz|find|module/i);
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
