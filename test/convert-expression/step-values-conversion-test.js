'use strict';

const { expect } = require('chai');
const conversion = require('../../src/convert-expression/step-values-conversion');

describe('step-values-conversion.js', () => {
    it('should convert step values', () => {
        var expressions = '1,2,3,4,5,6,7,8,9,10/2 0,1,2,3,4,5,6,7,8,9/5 * * * *'.split(' ');
        expressions = conversion(expressions);
        expect(expressions[0]).to.equal('2,4,6,8,10');
        expect(expressions[1]).to.equal('0,5');
    });

    it('should throw an error if step value is not a number', () => {
        var expressions = '1,2,3,4,5,6,7,8,9,10/someString 0,1,2,3,4,5,6,7,8,9/5 * * * *'.split(' ');
        expect(() => conversion(expressions)).to.throw('someString is not a valid step value');
    });

});
