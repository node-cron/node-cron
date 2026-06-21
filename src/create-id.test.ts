import { assert } from 'chai';
import { createID } from './create-id';

describe('createID function', () => {
  it('should return a valid UUID v4', () => {
    const id = createID();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should create unique IDs when called multiple times', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(createID());
    }
    assert.equal(ids.size, 100, 'All 100 generated IDs should be unique');
  });
});
