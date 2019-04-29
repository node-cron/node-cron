const { assert } = require('chai');
const storage = require('../src/storage');

describe('storage', () => {
    it('should store a task', () => {
        global.scheduledTasks = [];
        storage.save({});
        assert.lengthOf(global.scheduledTasks, 1);
    });

    it('should get all tasks', () => {
        global.scheduledTasks = [{}];
        assert.lengthOf(storage.getTasks(), 1);
    });

    describe('on import', () => {
        it('should keep stored items across imports', () => {
            delete require.cache[require.resolve('../src/storage')];
            global.scheduledTasks = [];
            storage.save({});
            let storage2 = require('../src/storage');
            assert.lengthOf(storage2.getTasks(), 1);
        });
    });
});