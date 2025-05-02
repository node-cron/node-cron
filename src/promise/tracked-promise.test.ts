import {assert} from 'chai'
import { TrackedPromise } from './tracked-promise';

describe('Tracked Promise', function(){
  it('wraps a promise', function(){
    const tp = new TrackedPromise((resolve) => { resolve('promise run') });
    assert.equal(tp.getState(), 'fulfilled');
    assert.equal(tp.getValue(), 'promise run');
  });

  it('allows await', async function(){
    const result = await new TrackedPromise((resolve) => { resolve('promise run') });
    assert.equal(result, 'promise run');
  });

  it('allows try catch', async function(){
    try{
      await new TrackedPromise((resolve, reject) => { reject('promise error') });
      assert.fail('should fail before');
    } catch(error) {
      assert.equal(error, 'promise error');
    }
  });

  it('allows use then', function(done){
    new TrackedPromise((resolve) => { resolve('promise run') }).then(result => {
      assert.equal(result, 'promise run');
      done();
    })
  })

  it('allows use catch', function(done){
    new TrackedPromise((resolve, reject) => { reject('promise error') }).catch(result => {
      assert.equal(result, 'promise error');
      done();
    });
  });

  it('allows use finally', function(done){
    new TrackedPromise((resolve, reject) => { reject('promise error') }).catch(result => {
      assert.equal(result, 'promise error');
    }).finally(() => {
      done();
    });
  });

  it('sets the state to rejected on fail', function(){
    const p = new TrackedPromise((resolve, reject) => { reject('promise error') });
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