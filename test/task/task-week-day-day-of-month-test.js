'use strict';

var expect = require('expect.js');
var Task = require('../../src/task');

describe('Task', () => {
  describe('week day & day of month', () => {

    it('should run on week day', () => {
      let executed = 0;
      var task = new Task('* * * * 1', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(1).to.equal(executed);
    });

    it('should run on day of month', () => {
      let executed = 0;
      var task = new Task('* * 1 * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(1).to.equal(executed);
    });

    it('should run on week day & day of month', () => {
      let executed = 0;
      var task = new Task('* * 1 * 1', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(2).to.equal(executed);
    });

    it('should run on week day with seconds', () => {
      let executed = 0;
      var task = new Task('0 * * * * 1', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(1).to.equal(executed);
    });

    it('should run on day of month with seconds', () => {
      let executed = 0;
      var task = new Task('0 * * 1 * *', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(1).to.equal(executed);
    });

    it('should run on week day & day of month with seconds', () => {
      let executed = 0;
      var task = new Task('0 * * 1 * 1', () => {
        executed += 1;
      });
      var date = new Date(2016, 0, 1);
      for (var day = 1; day <= 7; day++) {
        date.setDate(day);
        task.update(date);
      }
      expect(2).to.equal(executed);
    });

  });
});

