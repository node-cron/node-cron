import { assert } from 'chai';
import { EventEmitter } from 'events';
import { IpcRunCoordinator } from './ipc-run-coordinator';

// A fake IPC channel: captures sent messages and lets the test push replies
// back through the registered 'message' listener.
function makeChannel() {
  const emitter = new EventEmitter();
  const sent: any[] = [];
  const channel = {
    sent,
    send: (message: any) => { sent.push(message); },
    on: (event: string, listener: (m: any) => void) => emitter.on(event, listener),
    reply: (message: any) => emitter.emit('message', message),
  };
  return channel;
}

describe('IpcRunCoordinator', function () {
  it('sends a coordinator:shouldRun request and resolves with the reply', async function () {
    const channel = makeChannel();
    const coordinator = new IpcRunCoordinator(channel);

    const promise = coordinator.shouldRun('job:2026', 5000);
    const req = channel.sent[0];
    assert.equal(req.type, 'coordinator:shouldRun');
    assert.equal(req.key, 'job:2026');
    assert.equal(req.ttlMs, 5000);
    assert.isString(req.reqId);

    channel.reply({ type: 'coordinator:result', reqId: req.reqId, allowed: true });
    assert.isTrue(await promise);
  });

  it('resolves false when not elected', async function () {
    const channel = makeChannel();
    const coordinator = new IpcRunCoordinator(channel);

    const promise = coordinator.shouldRun('job:2026', 5000);
    channel.reply({ type: 'coordinator:result', reqId: channel.sent[0].reqId, allowed: false });
    assert.isFalse(await promise);
  });

  it('rejects when the parent reports a coordinator error (fail-closed)', async function () {
    const channel = makeChannel();
    const coordinator = new IpcRunCoordinator(channel);

    const promise = coordinator.shouldRun('job:2026', 5000);
    channel.reply({ type: 'coordinator:result', reqId: channel.sent[0].reqId, allowed: false, error: 'coordinator down' });

    let error: Error | undefined;
    await promise.catch((e) => { error = e; });
    assert.match(error!.message, /coordinator down/);
  });

  it('ignores unrelated messages and unknown request ids', async function () {
    const channel = makeChannel();
    const coordinator = new IpcRunCoordinator(channel);

    const promise = coordinator.shouldRun('job:2026', 5000);
    channel.reply({ event: 'task:started' });
    channel.reply({ type: 'coordinator:result', reqId: 'nope', allowed: true });
    channel.reply({ type: 'coordinator:result', reqId: channel.sent[0].reqId, allowed: true });
    assert.isTrue(await promise);
  });

  it('sends a coordinator:complete request', async function () {
    const channel = makeChannel();
    const coordinator = new IpcRunCoordinator(channel);

    await coordinator.onComplete('job:2026');
    assert.deepEqual(channel.sent[0], { type: 'coordinator:complete', key: 'job:2026' });
  });

  it('does not throw when the channel has no send (parent gone)', async function () {
    const coordinator = new IpcRunCoordinator({ on: () => {} });
    await coordinator.onComplete('job:2026');
    // shouldRun stays pending (no parent to reply); just assert it returns a promise.
    assert.instanceOf(coordinator.shouldRun('job:2026', 1000), Promise);
  });
});
