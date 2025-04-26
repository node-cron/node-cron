import chai from 'chai';
const { assert } = chai;
import { useFakeTimers } from 'sinon/pkg/sinon-esm.js';
import Task from './task.js';

let clock;
describe('Task', () => {
    beforeEach(() => {
        clock = useFakeTimers(new Date(2018, 0, 1, 0, 0, 0, 0));
    });

    afterEach(() => {
        clock.restore();
    });

    it('should emit event on finish a task', async () => {
        let finished = false;
        let task = new Task(() => 'ok');
        task.on('task-finished', () => finished = true);
        await task.execute();
        assert.equal(true, finished);
    });

    it('should emit event on error a task', async () => {
        let error;
        let task = new Task(() => {
            throw Error('execution error');
        });
        task.on('task-failed', (err) => error = err.message);
        await task.execute();
        assert.equal('execution error', error);
    });

    it('should emit event on finish a promise task', async () => {
        let finished = false;
        const promise = () => new Promise((resolve) => resolve('ok'));
        let task = new Task(promise);
        task.on('task-finished', () => finished = true);
        await task.execute();
        assert.equal(true, finished);
    });

    it('should emit event on error a promise task', async () => {
        let failed = false;
        const promise = () => new Promise((resolve, reject) => reject('errou'));
        const task = new Task(promise);
        task.on('task-failed', (error) => failed = error);
        await task.execute();
        assert.equal('errou', failed);
    });
});