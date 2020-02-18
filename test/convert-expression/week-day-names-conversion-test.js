'use strict';

var expect = require('expect.js');
var conversion = require('../../src/convert-expression/week-day-names-conversion');

describe('week-day-names-conversion.js', () => {
  it('shuld convert week day names names', () => {
    var weekDays = conversion('Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday');
    expect(weekDays).to.equal('1,2,3,4,5,6,0');
  });

  it('shuld convert short week day names names', () => {
    var weekDays = conversion('Mon,Tue,Wed,Thu,Fri,Sat,Sun');
    expect(weekDays).to.equal('1,2,3,4,5,6,0');
  });

  it('shuld convert 7 to 0', () => {
    var weekDays = conversion('7');
    expect(weekDays).to.equal('0');
  });
});
