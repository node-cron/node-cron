const { assert } = require('chai');
const storage = require('../src/storage');

describe('storage', () => {
    it('should store a task', () => {
        global.scheduledTasks = new Map();
        storage.save({});
        assert.lengthOf(global.scheduledTasks, 1);
    });

    it('should get all tasks', () => {
        global.scheduledTasks = new Map();
        global.scheduledTasks.set(0, {});
        assert.lengthOf(storage.getTasks(), 1);
    });

    it('should delete a task', () => {
        global.scheduledTasks = new Map();
        global.scheduledTasks.set('id1', 'test');
        global.scheduledTasks.set('id2', 'test2');
        storage.delete('id2');
        assert.equal(storage.getTasks().get('id1'), 'test');
        assert.equal(storage.getTasks().get('id2'), undefined);
    });

    describe('on import', () => {
        it('should keep stored items across imports', () => {
            delete require.cache[require.resolve('../src/storage')];
            global.scheduledTasks = new Map();
            storage.save({});
            let storage2 = require('../src/storage');
            assert.lengthOf(storage2.getTasks(), 1);
        });
    });
});