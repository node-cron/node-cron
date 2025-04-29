import * as chai from 'chai';
const { expect } = chai;
import conversion from './index';

describe('month-names-conversion', function() {
    it('shuld convert month names', function() {
        const expression = conversion('* * * * January,February *');
        const expressions = expression.split(' ');
        expect(expressions[4]).to.equal('1,2');
    });

    it('shuld convert week day names', function() {
        const expression = conversion('* * * * * Mon,Sun');
        const expressions = expression.split(' ');
        expect(expressions[5]).to.equal('1,0');
    });
});
