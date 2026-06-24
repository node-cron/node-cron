import * as chai from 'chai';
const { expect } = chai;
import conversion from './week-day-names-conversion';

describe('week-day-names-conversion', function() {
    it('shuld convert week day names names', function() {
        const weekDays = conversion('Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday');
        expect(weekDays).to.equal('1,2,3,4,5,6,0');
    });

    it('shuld convert short week day names names', function() {
        const weekDays = conversion('Mon,Tue,Wed,Thu,Fri,Sat,Sun');
        expect(weekDays).to.equal('1,2,3,4,5,6,0');
    });

    it('should pass through 7 unchanged (normalized later in the pipeline)', function() {
        const weekDays = conversion('7');
        expect(weekDays).to.equal('7');
    });

    it('should not touch ranges containing 7', function() {
        expect(conversion('5-7')).to.equal('5-7');
        expect(conversion('1-7')).to.equal('1-7');
        expect(conversion('6-7')).to.equal('6-7');
        expect(conversion('0-7')).to.equal('0-7');
    });
});
