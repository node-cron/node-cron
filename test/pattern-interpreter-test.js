'use strict';

var expect = require('expect.js');
var interpret = require('../src/pattern-interpreter');

describe('pattern-interpreter.js', function(){
  describe('interpret month names', function(){
    it('should convert month names to int', function(){
      var pattern = interpret('0 1 0 January,February,March,April,May,June,July,August,September,October,November,December *');
      var patterns = pattern.split(' ');
      expect(patterns[4]).to.equal('1,2,3,4,5,6,7,8,9,10,11,12');
    });

    it('should convert month short names to int', function(){
      var pattern = interpret('0 1 0 Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec *');
      var patterns = pattern.split(' ');
      expect(patterns[4]).to.equal('1,2,3,4,5,6,7,8,9,10,11,12');
    });
  });

  describe('interpret week days names', function(){
    it('should convert names to int', function(){
      var pattern = interpret('0 1 0 * Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday');
      var patterns = pattern.split(' ');
      expect(patterns[5]).to.equal('1,2,3,4,5,6,0');
    });

    it('should convert short names to int', function(){
      var pattern = interpret('0 1 0 * Sunday,Mon,Tue,Wed,Thu,Fri,Sat');
      var patterns = pattern.split(' ');
      expect(patterns[5]).to.equal('0,1,2,3,4,5,6');
    });
  });

  describe('interpret ranges', function(){
    it('should convert a range to a sequence of numbers', function(){
      var pattern = interpret('1-9 * * * *');
      var patterns = pattern.split(' ');
      expect(patterns[1]).to.equal('1,2,3,4,5,6,7,8,9');
    });

    it('should convert all ranges to sequences of numbers', function(){
      var pattern = interpret('1-9 * * 3-6 *');
      var patterns = pattern.split(' ');
      expect(patterns[1]).to.equal('1,2,3,4,5,6,7,8,9');
      expect(patterns[4]).to.equal('3,4,5,6');
    });

    it('should convert multiples ranges to a sequence of numbers', function(){
      var pattern = interpret('1-9,13-16 * * * *');
      var patterns = pattern.split(' ');
      expect(patterns[1]).to.equal('1,2,3,4,5,6,7,8,9,13,14,15,16');
    });
  });

  describe('convert *', function(){
    it('should convert * on seconds to numbers', function(){
      var pattern = interpret('* * * * * *');
      var seconds = pattern.split(' ')[0].split(',');
      for(var i = 0; i < 60; i++){
        expect(seconds[i]).to.equal(i.toString());
      }
    });

    it('should convert * on minutes to numbers', function(){
      var pattern = interpret('* * * * * *');
      var minutes = pattern.split(' ')[1].split(',');
      for(var i = 0; i < 60; i++){
        expect(minutes[i]).to.equal(i.toString());
      }
    });

    it('should convert * on hours to numbers', function(){
      var pattern = interpret('* * * * * *');
      var hours = pattern.split(' ')[2].split(',');
      for(var i = 0; i < 23; i++){
        expect(hours[i]).to.equal(i.toString());
      }
    });

    it('should convert * on days to numbers', function(){
      var pattern = interpret('* * * * * *');
      var days = pattern.split(' ')[3].split(',');
      for(var i = 0; i < 31; i++){
        expect(days[i]).to.equal((i+1).toString());
      }
    });

    it('should convert * on months to numbers', function(){
      var pattern = interpret('* * * * * *');
      var months = pattern.split(' ')[3].split(',');
      for(var i = 0; i < 12; i++){
        expect(months[i]).to.equal((i+1).toString());
      }
    });

    it('should convert * on week day to numbers', function(){
      var pattern = interpret('* * * * * *');
      var weekDays = pattern.split(' ')[5].split(',');
      for(var i = 0; i < 6; i++){
        expect(weekDays[i]).to.equal(i.toString());
      }
    });

    it('should convert week day 7 to 0', function(){
      var pattern = interpret('* * * * * 7');
      var weekDay = pattern.split(' ')[5];
      expect(weekDay).to.equal('0');
    });
  });

  describe('convert step value', function(){
    it('should convert * with step value to numbers', function(){
      var pattern = interpret('*/2 * * * * *');
      var seconds = pattern.split(' ')[0].split(',');
      expect(seconds.length).to.equal(30);
    });
  });
});
