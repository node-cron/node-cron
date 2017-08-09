'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', function(){
  describe('week day & day of month', function(){

    it('should run on week day', function(){
      var task = new Task('* * * * 1', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(1).to.equal(task.executed);
    });

    it('should run on day of month', function(){
      var task = new Task('* * 1 * *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(1).to.equal(task.executed);
    });

    it('should run on week day & day of month', function(){
      var task = new Task('* * 1 * 1', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(2).to.equal(task.executed);
    });

    it('should run on week day with seconds', function(){
      var task = new Task('0 * * * * 1', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(1).to.equal(task.executed);
    });

    it('should run on day of month with seconds', function(){
      var task = new Task('0 * * 1 * *', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(1).to.equal(task.executed);
    });

    it('should run on week day & day of month with seconds', function(){
      var task = new Task('0 * * 1 * 1', function(){
        this.executed += 1;
      });
      task.executed = 0;
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(2).to.equal(task.executed);
    });

  });
});

