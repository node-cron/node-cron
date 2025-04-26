'use strict';

const { expect } = require('chai');
const Task = require('../task');

describe('Task', () => {
    it('should accept a function', () => {
        expect(() => {
            new Task(() => {});
        }).to.not.throw();
    });

    it('should fail without a function', () => {
        expect(() => {
            new Task([]);
        }).to.throw('execution must be a function');
    });

});
