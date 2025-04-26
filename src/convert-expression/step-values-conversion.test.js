import chai from 'chai';
const { expect } = chai;
import conversion from './step-values-conversion.js';

describe('step-values-conversion.js', function() {
    it('should convert step values', function() {
        var expressions = '1,2,3,4,5,6,7,8,9,10/2 0,1,2,3,4,5,6,7,8,9/5 * * * *'.split(' ');
        expressions = conversion(expressions);
        expect(expressions[0]).to.equal('2,4,6,8,10');
        expect(expressions[1]).to.equal('0,5');
    });

    it('should throw an error if step value is not a number', function() {
        var expressions = '1,2,3,4,5,6,7,8,9,10/someString 0,1,2,3,4,5,6,7,8,9/5 * * * *'.split(' ');
        expect(() => conversion(expressions)).to.throw('someString is not a valid step value');
    });

});
