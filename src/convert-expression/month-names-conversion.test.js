import chai from 'chai';
const { expect } = chai;
import conversion from './month-names-conversion.js';

describe('month-names-conversion.js', function() {
    it('shuld convert month full names', function() {
        const months = conversion('January,February,March,April,May,June,July,August,September,October,November,December');
        expect(months).to.equal('1,2,3,4,5,6,7,8,9,10,11,12');
    });

    it('shuld convert month names', function() {
        const months = conversion('Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec');
        expect(months).to.equal('1,2,3,4,5,6,7,8,9,10,11,12');
    });
});
