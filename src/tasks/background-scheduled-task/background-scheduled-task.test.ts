import { assert } from 'chai';
import sinon from 'sinon';

import BackgroundScheduledTask from "./background-scheduled-task";

import { EventEmitter } from 'stream';
import { equal } from 'assert';


describe('BackgroundScheduledTask', function() {
  this.timeout(10000);
  
  let fakeChildProcess: EventEmitter & { send: sinon.SinonStub; kill: sinon.SinonStub };
  let forkStub: sinon.SinonStub;

  beforeEach(() => {
    fakeChildProcess = Object.assign(new EventEmitter(), {
      send: sinon.stub(),
      kill: sinon.stub(),
      killed: false
    });

    forkStub = sinon.stub(require('child_process'), 'fork').returns(fakeChildProcess as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('creates a new background task', function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      assert.isTrue(task.id.startsWith('task-'));
      assert.equal(task.id, task.name);
      assert.equal(task.getStatus(), 'stopped');
  });

  describe('start', () => {
    it('do not fail if already started', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess = Object.assign(new EventEmitter(), {
        send: sinon.stub(),
        kill: sinon.stub()
      });
      task.forkProcess = fakeChildProcess as any;

      const result = await task.start();
      assert.isUndefined(result);
    });

    it('starts new fork', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(()=>{
        task.emitter.emit('task:started');
      });

      const result = await task.start();
      assert.isUndefined(result);
    });

    it('fails on fork failure', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(()=>{
        fakeChildProcess.emit('error', new Error('fake error'));
      });

      try{
        await task.start();
        assert.fail('should throw error no start')
      } catch (error: any){
        assert.equal(error.message, 'Error on daemon: fake error');
      }
    });

    it('fails on fork exception', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.throws(new Error('fake error'));

      try{
        await task.start();
        assert.fail('should throw error no start')
      } catch (error: any){
        assert.equal(error.message, 'fake error');
      }
    });

    it('fails on fork exit with code', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(()=>{
        fakeChildProcess.emit('exit', 9);
      });
      
      try{
        await task.start();
        assert.fail('should throw error no start')
      } catch (error: any){
        assert.equal(error.message, 'node-cron daemon exited with code 9');
      }
    });

    it('fails on fork exit with signal', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(()=>{
        fakeChildProcess.emit('exit', 'SIGNAL');
      });
      
      try{
        await task.start();
        assert.fail('should throw error no start')
      } catch (error: any){
        assert.equal(error.message, 'node-cron daemon exited with code SIGNAL');
      }
    });

    it('starts and bypass events', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
  
      fakeChildProcess.send.callsFake(async ()=>{
        task.emitter.emit('task:started');
        await wait(100);
        fakeChildProcess.emit('message', { event: 'execution:failed', context: { date: new Date(), task: {
          state: task.stateMachine.state,
          ...task
        }, execution: {}}, jsonError: JSON.stringify( { name: 'Error', message: 'task failed', extra: 'extra', stack: 'fake stack'})})
      });

      const waitEvent = new Promise(r => {
        task.on('execution:failed', event => {
          r(event)
        })
      });

      await task.start();
      const event: any = await waitEvent;
      assert.equal(event.execution?.error.message, 'task failed');
      assert.equal(event.execution?.error.extra, 'extra');
      assert.equal(event.execution?.error.stack, 'fake stack');
      assert.equal(event.task.stateMachine.state, 'stopped')
    });

    it('fails on start timeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      fakeChildProcess = Object.assign(new EventEmitter(), {
        send: sinon.stub(),
        kill: sinon.stub()
      });

      try {
        await task.start();
        assert.fail("should fail before")
      } catch (error: any){
        assert.equal(error.message, 'Start operation timed out');
      }
    });
  });

  describe('stop', function(){
    it('do not fail if the task is stoped', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      const result = await task.stop();
      assert.isUndefined(result);
    });

    it('stop the task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      task.forkProcess = fakeChildProcess as any;
      fakeChildProcess.send.callsFake(()=>{
        task.emitter.emit('task:stopped');
      });

      const result = await task.stop();
      assert.isUndefined(result);
    });

    it('fails on stop timeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;
   
      try {
        await task.stop();
        assert.fail("should fail before")
      } catch (error: any){
        assert.equal(error.message, 'Stop operation timed out');
      }
    });
  });

  describe('destroy', function(){
    it('destroys stopped task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      const result = await task.destroy();
      assert.isUndefined(result);
    });

    it('destroys a task an kills the fork', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;

      fakeChildProcess.send.callsFake(()=>{
        task.emitter.emit('task:destroyed');
      });

      const result = await task.destroy();
      assert.isUndefined(result);
    });

    it('fails on destriy timeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      task.forkProcess = fakeChildProcess as any;

      try {
        await task.destroy();
        assert.fail("should fail before")
      } catch (error: any){
        assert.equal(error.message, 'Destroy operation timed out');
      }
    });
  });

  describe('execute', function(){
    it('fails when call execute on stoped task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      try {
        await task.execute();
      } catch(error: any){
        assert.equal(error.message, "Cannot execute background task because it hasn\'t been started yet. Please initialize the task using the start() method before attempting to execute it.")
      }
    });

    it('executes a task', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.callsFake((obj)=>{
        if(obj.command === 'task:execute'){
          task.emitter.emit('execution:finished', {execution: { result: "task result"}});
        } else {
          task.emitter.emit('task:started');
        }
      })

      await task.start();
      
      const result = await task.execute();
      assert.equal(result, 'task result');
    });

    it('throw error on execution fail', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');

      fakeChildProcess.send.callsFake((obj)=>{
        if(obj.command === 'task:execute'){
          task.emitter.emit('execution:failed', {execution: { error: Error("task error")}});
        } else {
          task.emitter.emit('task:started');
        }
      })

      await task.start();
      
      try{
      const result = await task.execute();
      } catch(error: any){
        assert.equal(error.message, 'task error');
      }
    });

    it('fails on execute timeout', async function(){
      const task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
      
      fakeChildProcess.send.callsFake((obj)=>{
        if(obj.command === 'task:start'){
          task.emitter.emit('task:started');
        }
      })
   
      await task.start();

      try {
        await task.execute();
        assert.fail("should fail before")
      } catch (error: any){
        assert.equal(error.message, 'Execution timeout exceeded');
      }
    });
  });
});


function wait(time: number){
  return new Promise(r=> setTimeout(r, time));
}