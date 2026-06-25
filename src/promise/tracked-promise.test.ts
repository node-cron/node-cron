import { TrackedPromise } from './tracked-promise';

describe('Tracked Promise', function(){
  it('wraps a promise', function(){
    const tp = new TrackedPromise((resolve) => { resolve('promise run') });
    expect(tp.getPromise()).toBeDefined();
    expect(tp.getState()).toBe('fulfilled');
    expect(tp.isFulfilled()).toBe(true);
    expect(tp.isPending()).toBe(false);
    expect(tp.isRejected()).toBe(false);
    expect(tp.getValue()).toBe('promise run');
  });

  it('returns pending status', function(){
    const tp = new TrackedPromise((resolve) => { setTimeout(() => {resolve('promise run')}, 500) });
    expect(tp.getState()).toBe('pending');
    expect(tp.isFulfilled()).toBe(false);
    expect(tp.isPending()).toBe(true);
    expect(tp.isRejected()).toBe(false);
  });

  it('returns rejected status', async function(){
    const tp = new TrackedPromise((r, reject) => { reject(new Error('promise error')) });
    try {
      await tp;
    } catch(error: any){
      expect(error.message).toBe('promise error');
    }
    expect(tp.getState()).toBe('rejected');
    expect(tp.isFulfilled()).toBe(false);
    expect(tp.isPending()).toBe(false);
    expect(tp.isRejected()).toBe(true);
    expect(tp.getError()).toBeDefined();
  });
  

  it('allows await', async function(){
    const result = await new TrackedPromise((resolve) => { resolve('promise run') });
    expect(result).toBe('promise run');
  });

  it('allows try catch', async function(){
    try{
      await new TrackedPromise((resolve, reject) => { reject(new Error('promise error')) });
      expect.fail('should fail before');
    } catch(error: any) {
      expect(error.message).toBe('promise error');
    }
  });

  it('allows use then', function(){
    return new TrackedPromise((resolve) => { resolve('promise run') }).then(result => {
      expect(result).toBe('promise run');
    })
  })

  it('allows use catch', function(){
    return new TrackedPromise((resolve, reject) => { reject(new Error('promise error')) }).catch(error => {
      expect(error.message).toBe('promise error');
    });
  });

  it('allows use finally', function(){
    return new TrackedPromise((resolve) => { resolve('promise run') }).finally(() => {});
  });

  it('sets the state to rejected on fail', function(){
    const p = new TrackedPromise((resolve, reject) => { reject(new Error('promise error')) });
    p.catch(() => {});
    expect(p.getState()).toBe('rejected')
  });

  it('sets the state to pending when running', function(){
    const p = new TrackedPromise(async (resolve) => { 
      await new Promise(resolve => setTimeout(resolve, 1000));
      resolve(true);
    });
    expect(p.getState()).toBe('pending')
  });
});