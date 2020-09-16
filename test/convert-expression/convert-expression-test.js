'use strict';

const { expect } = require('chai');
const conversion = require('../../src/convert-expression');

describe('month-names-conversion.js', () => {
    it('shuld convert month names', () => {
        const expression = conversion('* * * * January,February *');
        const expressions = expression.split(' ');
        expect(expressions[4]).to.equal('1,2');
    });

    it('shuld convert week day names', () => {
        const expression = conversion('* * * * * Mon,Sun');
        const expressions = expression.split(' ');
        expect(expressions[5]).to.equal('1,0');
    });
});
