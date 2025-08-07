import * as chai from 'chai';
const { expect } = chai;

import conversion from './range-conversion.js';

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
});
