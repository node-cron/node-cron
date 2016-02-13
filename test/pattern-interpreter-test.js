'use strict';

var expect = require('expect.js');
var interpret = require('../src/pattern-interpreter');

describe('pattern-interpreter.js', function(){
  describe('interpret month names', function(){
    it('should convert month names to int', function(){
      var pattern = interpret('0 1 0 January,February,March,April,May,June,July,August,September,October,November,December *');
      expect(pattern).to.equal('0 1 0 1,2,3,4,5,6,7,8,9,10,11,12 *');
    });

    it('should convert month short names to int', function(){
      var pattern = interpret('0 1 0 Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec *');
      expect(pattern).to.equal('0 1 0 1,2,3,4,5,6,7,8,9,10,11,12 *');
    });
  });

  describe('interpret week days names', function(){
    it('should convert names to int', function(){
      var pattern = interpret('0 1 0 Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday *');
      expect(pattern).to.equal('0 1 0 1,2,3,4,5,6,0 *');
    });

    it('should convert short names to int', function(){
      var pattern = interpret('0 1 0 Sunday,Mon,Tue,Wed,Thu,Fri,Sat *');
      expect(pattern).to.equal('0 1 0 0,1,2,3,4,5,6 *');
    });
  });

  describe('interpret ranges', function(){
    it('should convert a range to a sequence of numbers', function(){
      var pattern = interpret('1-9 * * * *');
      expect(pattern).to.equal('1,2,3,4,5,6,7,8,9 * * * *');
    });

    it('should convert all ranges to sequences of numbers', function(){
      var pattern = interpret('1-9 * * 3-6 *');
      expect(pattern).to.equal('1,2,3,4,5,6,7,8,9 * * 3,4,5,6 *');
    });

    it('should convert multiples ranges to a sequence of numbers', function(){
      var pattern = interpret('1-9,13-16 * * * *');
      expect(pattern).to.equal('1,2,3,4,5,6,7,8,9,13,14,15,16 * * * *');
    });
  });
});
