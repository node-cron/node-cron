import { assert } from 'chai';
import { EventEmitter } from 'events';
import { IpcLockProvider } from './ipc-lock-provider';

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

describe('IpcLockProvider', function () {
  it('sends a lock:acquire request and resolves with the reply', async function () {
    const channel = makeChannel();
    const provider = new IpcLockProvider(channel);

    const promise = provider.acquire('job:2026', 5000);
    const req = channel.sent[0];
    assert.equal(req.type, 'lock:acquire');
    assert.equal(req.key, 'job:2026');
    assert.equal(req.ttlMs, 5000);
    assert.isString(req.reqId);

    channel.reply({ type: 'lock:result', reqId: req.reqId, acquired: true });
    assert.isTrue(await promise);
  });

  it('resolves false when the lock is held elsewhere', async function () {
    const channel = makeChannel();
    const provider = new IpcLockProvider(channel);

    const promise = provider.acquire('job:2026', 5000);
    channel.reply({ type: 'lock:result', reqId: channel.sent[0].reqId, acquired: false });
    assert.isFalse(await promise);
  });

  it('rejects when the parent reports a provider error (fail-closed)', async function () {
    const channel = makeChannel();
    const provider = new IpcLockProvider(channel);

    const promise = provider.acquire('job:2026', 5000);
    channel.reply({ type: 'lock:result', reqId: channel.sent[0].reqId, acquired: false, error: 'redis down' });

    let error: Error | undefined;
    await promise.catch((e) => { error = e; });
    assert.match(error!.message, /redis down/);
  });

  it('ignores unrelated messages and unknown request ids', async function () {
    const channel = makeChannel();
    const provider = new IpcLockProvider(channel);

    const promise = provider.acquire('job:2026', 5000);
    channel.reply({ event: 'task:started' });
    channel.reply({ type: 'lock:result', reqId: 'nope', acquired: true });
    channel.reply({ type: 'lock:result', reqId: channel.sent[0].reqId, acquired: true });
    assert.isTrue(await promise);
  });

  it('sends a lock:release request', async function () {
    const channel = makeChannel();
    const provider = new IpcLockProvider(channel);

    await provider.release('job:2026');
    assert.deepEqual(channel.sent[0], { type: 'lock:release', key: 'job:2026' });
  });

  it('does not throw when the channel has no send (parent gone)', async function () {
    const provider = new IpcLockProvider({ on: () => {} });
    await provider.release('job:2026');
    // acquire stays pending (no parent to reply); just assert it returns a promise.
    assert.instanceOf(provider.acquire('job:2026', 1000), Promise);
  });
});
