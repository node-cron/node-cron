import * as chai from 'chai';
const { assert } = chai;
import conversion from './index';

describe('month-names-conversion', function() {
    it('shuld convert month names', function() {
        const expressions = conversion('* * * * January,February *');
        assert.deepEqual(expressions[4], [1,2]);
    });

    it('shuld convert week day names', function() {
      const expressions = conversion('* * * * * Mon,Sun');
      assert.deepEqual(expressions[5], [1,0]);
    });
});

describe('weekday 7-to-0 normalization', function() {
    it('should convert standalone 7 to 0', function() {
        const expressions = conversion('* * * * * 7');
        assert.deepEqual(expressions[5], [0]);
    });

    it('should convert 7 in a list to 0', function() {
        const expressions = conversion('* * * * * 1,7');
        assert.deepEqual(expressions[5], [1,0]);
    });

    it('should deduplicate when both 0 and 7 are present', function() {
        const expressions = conversion('* * * * * 0,7');
        assert.deepEqual(expressions[5], [0]);
    });

    it('should expand range 5-7 to Fri,Sat,Sun', function() {
        const expressions = conversion('* * * * * 5-7');
        assert.deepEqual(expressions[5], [5,6,0]);
    });

    it('should expand range 1-7 to all days', function() {
        const expressions = conversion('* * * * * 1-7');
        assert.deepEqual(expressions[5], [1,2,3,4,5,6,0]);
    });

    it('should expand range 6-7 to Sat,Sun', function() {
        const expressions = conversion('* * * * * 6-7');
        assert.deepEqual(expressions[5], [6,0]);
    });

    it('should expand range 0-7 to all days', function() {
        const expressions = conversion('* * * * * 0-7');
        assert.deepEqual(expressions[5], [0,1,2,3,4,5,6]);
    });
});

describe('nicknames', function() {
    it('should convert @yearly', function() {
        const expressions = conversion('@yearly');
        assert.deepEqual(expressions[0], [0]);
        assert.deepEqual(expressions[1], [0]);
        assert.deepEqual(expressions[2], [0]);
        assert.deepEqual(expressions[4], [1]);
    });

    it('should convert @daily', function() {
        const expressions = conversion('@daily');
        assert.deepEqual(expressions[0], [0]);
        assert.deepEqual(expressions[1], [0]);
        assert.deepEqual(expressions[2], [0]);
    });

    it('should convert @hourly', function() {
        const expressions = conversion('@hourly');
        assert.deepEqual(expressions[0], [0]);
        assert.deepEqual(expressions[1], [0]);
    });
});
