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

    it('should perform a task', async () => {
        let task = new Task(() => 'ok');
        const result = await task.execute();
        assert.equal(result, 'ok');
    });
});