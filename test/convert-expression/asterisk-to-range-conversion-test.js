'use strict';

const { expect } = require('chai');
const conversion = require('../../src/convert-expression/asterisk-to-range-conversion');

describe('asterisk-to-range-conversion.js', () => {
    it('shuld convert * to ranges', () => {
        const expressions = '* * * * * *'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).to.equal('0-59 0-59 0-23 1-31 1-12 0-6');
    });
});
