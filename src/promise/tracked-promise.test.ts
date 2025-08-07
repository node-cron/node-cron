import {assert} from 'chai'

import { TrackedPromise } from './tracked-promise.js';

describe('Tracked Promise', function(){
  it('wraps a promise', function(){
    const tp = new TrackedPromise((resolve) => { resolve('promise run') });
    assert.isDefined(tp.getPromise())
    assert.equal(tp.getState(), 'fulfilled');
    assert.isTrue(tp.isFulfilled());
    assert.isFalse(tp.isPending());
    assert.isFalse(tp.isRejected());
    assert.equal(tp.getValue(), 'promise run');
  });

  it('returns pending status', function(){
    const tp = new TrackedPromise((resolve) => { setTimeout(() => {resolve('promise run')}, 500) });
    assert.equal(tp.getState(), 'pending');
    assert.isFalse(tp.isFulfilled());
    assert.isTrue(tp.isPending());
    assert.isFalse(tp.isRejected());
  });

  it('returns rejected status', async function(){
    const tp = new TrackedPromise((r, reject) => { reject(new Error('promise error')) });
    try {
      await tp;
    } catch(error: any){
      assert.equal(error.message, 'promise error');
    }
    assert.equal(tp.getState(), 'rejected');
    assert.isFalse(tp.isFulfilled());
    assert.isFalse(tp.isPending());
    assert.isTrue(tp.isRejected());
    assert.isDefined(tp.getError());
  });


  it('allows await', async function(){
    const result = await new TrackedPromise((resolve) => { resolve('promise run') });
    assert.equal(result, 'promise run');
  });

  it('allows try catch', async function(){
    try{
      await new TrackedPromise((resolve, reject) => { reject(new Error('promise error')) });
      assert.fail('should fail before');
    } catch(error: any) {
      assert.equal(error.message, 'promise error');
    }
  });

  it('allows use then', function(done){
    new TrackedPromise((resolve) => { resolve('promise run') }).then(result => {
      assert.equal(result, 'promise run');
      done();
    })
  })

  it('allows use catch', function(done){
    new TrackedPromise((resolve, reject) => { reject(new Error('promise error')) }).catch(error => {
      assert.equal(error.message, 'promise error');
      done();
    });
  });

  it('allows use finally', function(done){
    new TrackedPromise((resolve) => { resolve('promise run') }).finally(() => {
      done();
    });
  });

  it('sets the state to rejected on fail', function(){
    const p = new TrackedPromise((resolve, reject) => { reject(new Error('promise error')) });
    assert.equal(p.getState(), 'rejected')
  });

  it('sets the state to pending when running', function(){
    const p = new TrackedPromise(async (resolve) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      resolve(true);
    });
    assert.equal(p.getState(), 'pending')
  });
});
