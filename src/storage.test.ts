import { assert } from 'chai';
import * as storage from './storage';

describe('storage', function() {
    it('should store a task', function() {
        storage.clear();
        storage.save({});
        assert.lengthOf(storage.getTasks(), 1);
    });
});