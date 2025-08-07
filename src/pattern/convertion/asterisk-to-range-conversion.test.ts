import * as chai from 'chai';
const { expect } = chai;

import conversion from './asterisk-to-range-conversion.js';

describe('asterisk-to-range-conversion', function() {
    it('shuld convert * to ranges', function() {
        const expressions = '* * * * * *'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).to.equal('0-59 0-59 0-23 1-31 1-12 0-6');
    });

    it('shuld convert * to ranges with step', function() {
      const expressions = '*/2 * * * * *'.split(' ');
      const expression = conversion(expressions).join(' ');
      expect(expression).to.equal('0-59/2 0-59 0-23 1-31 1-12 0-6');
  });
});
