import * as chai from 'chai';
const { expect } = chai;
import conversion from './range-conversion';

describe('range-conversion', function() {
    it('should convert ranges to numbers', function() {
        const expressions = '0-3 0-3 8-10 1-3 1-2 0-3'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).to.equal('0,1,2,3 0,1,2,3 8,9,10 1,2,3 1,2 0,1,2,3');
    });

    it('should convert comma delimited ranges to numbers', function() {
        const expressions = '0-2,10-23'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).to.equal('0,1,2,10,11,12,13,14,15,16,17,18,19,20,21,22,23');
    });

    it('should convert comma delimited ranges to numbers with step', function() {
      const expressions = '0-10/2 11-21/2'.split(' ');
      const expression = conversion(expressions).join(' ');
      expect(expression).to.equal('0,2,4,6,8,10 11,13,15,17,19,21');
  });

    it('should expand a reversed range', function() {
        expect(conversion(['5-3']).join(' ')).to.equal('3,4,5');
    });

    it('should leave malformed multi-dash forms untouched', function() {
        // Only whole `n-n` / `n-n/step` tokens expand; mangling these into
        // valid-looking numbers is what let `1-2-3` slip past validation.
        expect(conversion(['1-2-3'])[0]).to.equal('1-2-3');
        expect(conversion(['1-2-3-4'])[0]).to.equal('1-2-3-4');
        expect(conversion(['L-3-5'])[0]).to.equal('L-3-5');
    });

    it('should leave a non-positive step untouched (no infinite loop)', function() {
        expect(conversion(['1-5/0'])[0]).to.equal('1-5/0');
    });
});
