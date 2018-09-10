'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', () => {
  describe('week day', () => {
    it('should run on week day', () => {
      let executed = 0;
      var task = new Task('* * * * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      date.setDate(4);
      task.update(date);
      date.setDate(5);
      task.update(date);
      date.setDate(6);
      task.update(date);
      expect(3).to.equal(executed);
    });

    it('should run only on week day 3', () => {
      let executed = 0;
      var task = new Task('* * * * 3', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      date.setDate(5);
      task.update(date);
      date.setDate(6);
      task.update(date);
      date.setDate(9);
      task.update(date);
      expect(1).to.equal(executed);
    });

    it('should run only on week days 2, 3 and 5 ', () => {
      let executed = 0;
      var task = new Task('* * * * 2,3,5', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      date.setDate(4);
      task.update(date);
      date.setDate(5);
      task.update(date);
      date.setDate(6);
      task.update(date);
      date.setDate(7);
      task.update(date);
      date.setDate(8);
      task.update(date);
      expect(3).to.equal(executed);
    });

    it('should run in even week days', () => {
      let executed = 0;
      var task = new Task('* * * * */2', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      date.setDate(4);
      task.update(date);
      date.setDate(5);
      task.update(date);
      date.setDate(7);
      task.update(date);
      expect(2).to.equal(executed);
    });

    it('should run on monday', () => {
      let executed = 0;
      var task = new Task('* * * * Monday', () => {
        executed += 1;
      });
      task.update(new Date(2016, 0, 4));
      expect(1).to.equal(executed);
    });
  });
});

