import { describe, it } from 'mocha';
import { assert } from 'chai';

import { createID } from './create-id.js';

describe('createID function', () => {
  it('should create an ID with default length of 16', () => {
    const id = createID();
    assert.equal(id.length, 16, 'ID should have default length of 16');
    assert.match(id, /^[A-Za-z0-9]+$/, 'ID should only contain alphanumeric characters');
  });

  it('should create an ID with specified length', () => {
    const length = 24;
    const id = createID('', length);
    assert.equal(id.length, length, `ID should have length of ${length}`);
    assert.match(id, /^[A-Za-z0-9]+$/, 'ID should only contain alphanumeric characters');
  });

  it('should create an ID with prefix', () => {
    const prefix = 'test';
    const id = createID(prefix);
    assert.isTrue(id.startsWith(`${prefix}-`), `ID should start with "${prefix}-"`);
    assert.equal(id.length, prefix.length + 1 + 16, 'ID should have length of prefix + hyphen + 16');
    assert.match(id, new RegExp(`^${prefix}-[A-Za-z0-9]+$`), 'ID should have prefix followed by alphanumeric characters');
  });

  it('should create an ID with prefix and specified length', () => {
    const prefix = 'user';
    const length = 10;
    const id = createID(prefix, length);
    assert.isTrue(id.startsWith(`${prefix}-`), `ID should start with "${prefix}-"`);
    assert.equal(id.length, prefix.length + 1 + length, 'ID should have length of prefix + hyphen + specified length');
    assert.match(id, new RegExp(`^${prefix}-[A-Za-z0-9]+$`), 'ID should have prefix followed by alphanumeric characters');
  });

  it('should create unique IDs when called multiple times', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(createID());
    }
    assert.equal(ids.size, 100, 'All 100 generated IDs should be unique');
  });

  it('should handle empty prefix correctly', () => {
    const id = createID('');
    assert.isFalse(id.includes('-'), 'ID should not contain hyphen when prefix is empty');
    assert.equal(id.length, 16, 'ID should have default length of 16');
  });

  it('should handle zero length correctly', () => {
    const id = createID('test', 0);
    assert.equal(id, 'test-', 'ID should only contain prefix and hyphen when length is 0');
  });
});
