import * as chai from 'chai';
const { expect } = chai;

import conversion from './week-day-names-conversion.js';

describe('week-day-names-conversion', function() {
    it('shuld convert week day names names', function() {
        const weekDays = conversion('Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday');
        expect(weekDays).to.equal('1,2,3,4,5,6,0');
    });

    it('shuld convert short week day names names', function() {
        const weekDays = conversion('Mon,Tue,Wed,Thu,Fri,Sat,Sun');
        expect(weekDays).to.equal('1,2,3,4,5,6,0');
    });

    it('shuld convert 7 to 0', function() {
        const weekDays = conversion('7');
        expect(weekDays).to.equal('0');
    });
});
