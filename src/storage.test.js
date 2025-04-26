import chai from 'chai';
const { assert } = chai;
import * as storage from './storage.js';

describe('storage', function() {
    it('should store a task', function() {
        storage.clear();
        storage.save({});
        assert.lengthOf(storage.getTasks(), 1);
    });
});