'use strict';

const { expect } = require('chai');
const conversion = require('../../src/convert-expression/range-conversion');

describe('range-conversion.js', () => {
    it('shuld convert ranges to numbers', () => {
        const expressions = '0-3 0-3 0-2 1-3 1-2 0-3'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).to.equal('0,1,2,3 0,1,2,3 0,1,2 1,2,3 1,2 0,1,2,3');
    });

    it('shuld convert ranges to numbers', () => {
        const expressions = '0-3 0-3 8-10 1-3 1-2 0-3'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).to.equal('0,1,2,3 0,1,2,3 8,9,10 1,2,3 1,2 0,1,2,3');
    });

    it('should convert comma delimited ranges to numbers', () => {
        var expressions = '0-2,10-23'.split(' ');
        var expression = conversion(expressions).join(' ');
        expect(expression).to.equal('0,1,2,10,11,12,13,14,15,16,17,18,19,20,21,22,23');
    });
});
