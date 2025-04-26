import chai from 'chai';
const { assert } = chai;
import * as storage from './storage.js';

describe('storage', () => {
    it('should store a task', () => {
        storage.clear();
        storage.save({});
        assert.lengthOf(storage.getTasks(), 1);
    });
});