import * as chai from 'chai';
const { assert } = chai;
import { useFakeTimers } from 'sinon/pkg/sinon-esm.js';
import Task from './task.js';

let clock;
describe('Task', function() {
    beforeEach(function() {
        clock = useFakeTimers(new Date(2018, 0, 1, 0, 0, 0, 0));
    });

    afterEach(function() {
        clock.restore();
    });

    it('should perform a task', async function() {
        let task = new Task(() => 'ok');
        const result = await task.execute();
        assert.equal(result, 'ok');
    });
});