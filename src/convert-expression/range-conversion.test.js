import chai from 'chai';
const { expect } = chai;
import conversion from './range-conversion.js';

describe('range-conversion.js', function() {
    it('should convert ranges to numbers', function() {
        const expressions = '0-3 0-3 8-10 1-3 1-2 0-3'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).to.equal('0,1,2,3 0,1,2,3 8,9,10 1,2,3 1,2 0,1,2,3');
    });

    it('should convert comma delimited ranges to numbers', function() {
        var expressions = '0-2,10-23'.split(' ');
        var expression = conversion(expressions).join(' ');
        expect(expression).to.equal('0,1,2,10,11,12,13,14,15,16,17,18,19,20,21,22,23');
    });
});
