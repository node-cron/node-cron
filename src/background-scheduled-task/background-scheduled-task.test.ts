import { assert } from 'chai';
import BackgroundScheduledTask from './index';

describe('BackgroundScheduledTask', function() {
    it('should start a task by default', function(done) {
        let task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js');
        task.on('task-done', (result) => {
            assert.equal('dummy task', result);
            task.stop();
            done();
        });
    }).timeout(4000);

    it('should create a task stopped', function() {
        let task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', {
            scheduled: false
        });

        assert.isUndefined(task.pid());
    });

    it('should start a task', function(done) {
        let task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', {
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
    }).timeout(4000);
    
    it('should stop a task', function() {
        let task = new BackgroundScheduledTask('* * * * * *', './test-assets/dummy-task.js', {
            scheduled: true
        });
        assert.isNotNull(task.pid());
        task.stop();
    });
});