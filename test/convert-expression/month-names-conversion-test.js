'use strict';

var expect = require('expect.js');
var conversion = require('../../src/convert-expression/month-names-conversion');

describe('month-names-conversion.js', () => {
  it('shuld convert month names', () => {
    var months = conversion('January,February,March,April,May,June,July,August,September,October,November,December');
    expect(months).to.equal('1,2,3,4,5,6,7,8,9,10,11,12');
  });

  it('shuld convert month names', () => {
    var months = conversion('Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec');
    expect(months).to.equal('1,2,3,4,5,6,7,8,9,10,11,12');
  });
});
