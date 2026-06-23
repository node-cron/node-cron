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
