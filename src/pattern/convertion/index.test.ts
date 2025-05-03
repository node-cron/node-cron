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
