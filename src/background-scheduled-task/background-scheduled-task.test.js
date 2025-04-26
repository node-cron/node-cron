import chai from 'chai';
const { assert } = chai;
import BackgroundScheduledTask from './index.js';

describe('BackgroundScheduledTask', function() {
    it('should start a task by default', function(done) {
        let task = new BackgroundScheduledTask('* * * * * *', './src/test-assets/dummy-task.js');
        task.on('task-done', (result) => {
            assert.equal('dummy task', result);
            task.stop();
            done();
        });
    });

    it('should create a task stoped', function() {
        let task = new BackgroundScheduledTask('* * * * * *', './src/test-assets/dummy-task.js', {
            scheduled: false
        });

        assert.isUndefined(task.pid());
    });

    it('should start a task', function(done) {
        let task = new BackgroundScheduledTask('* * * * * *', './src/test-assets/dummy-task.js', {
            scheduled: false
        });

        assert.isUndefined(task.pid());

        task.on('task-done', (result) => {
            assert.equal('dummy task', result);
            task.stop();
            done();
        });

        task.start();
        assert.isNotNull(task.pid());
    });
    
    it('should stop a task', function() {
        let task = new BackgroundScheduledTask('* * * * * *', './src/test-assets/dummy-task.js', {
            scheduled: true
        });
        assert.isNotNull(task.pid());
        assert.isTrue(task.isChildProcessAlive());
        task.stop();
        assert.isFalse(task.isChildProcessAlive());
    });
});