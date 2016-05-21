'use strict';

var expect = require('expect.js');
var conversion = require('../../src/convert-expression');

describe('month-names-conversion.js', function() {
  it('shuld convert month names', function() {
    var expression = conversion('* * * * January,February *');
    var expressions = expression.split(' ');
    expect(expressions[4]).to.equal('1,2');
  });

  it('shuld convert week day names', function() {
    var expression = conversion('* * * * * Mon,Sun');
    var expressions = expression.split(' ');
    expect(expressions[5]).to.equal('1,0');
  });
});
