'use strict';

var expect = require('expect.js');
var conversion = require('../../src/convert-expression/step-values-conversion');

describe('step-values-conversion.js', () => {
  it('shuld convert step values', () => {
    var expressions = '1,2,3,4,5,6,7,8,9,10/2 0,1,2,3,4,5,6,7,8,9/5 * * * *'.split(' ');
    expressions = conversion(expressions);
    console.log(expressions);
    expect(expressions[0]).to.equal('2,4,6,8,10');
    expect(expressions[1]).to.equal('0,5');
  });
});
