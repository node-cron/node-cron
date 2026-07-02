import conversion from './range-conversion';

describe('range-conversion', function() {
    it('should convert ranges to numbers', function() {
        const expressions = '0-3 0-3 8-10 1-3 1-2 0-3'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).toBe('0,1,2,3 0,1,2,3 8,9,10 1,2,3 1,2 0,1,2,3');
    });

    it('should convert comma delimited ranges to numbers', function() {
        const expressions = '0-2,10-23'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).toBe('0,1,2,10,11,12,13,14,15,16,17,18,19,20,21,22,23');
    });

    it('should convert comma delimited ranges to numbers with step', function() {
      const expressions = '0-10/2 11-21/2'.split(' ');
      const expression = conversion(expressions).join(' ');
      expect(expression).toBe('0,2,4,6,8,10 11,13,15,17,19,21');
  });

    it('should wrap an inverted range through the field boundary instead of swapping it', function() {
        // Index 0 is the second/minute-shaped field (bounds 0-59): 5-3 wraps
        // 5..59 then 0..3, it does not become the swapped 3,4,5.
        const wrapped = conversion(['5-3'])[0].split(',').map(Number);
        expect(wrapped[0]).toBe(5);
        expect(wrapped[wrapped.length - 1]).toBe(3);
        expect(wrapped).not.toEqual([3, 4, 5]);
        expect(wrapped).toHaveLength(59);
    });

    it('should wrap inverted hours through midnight (22-2 does not contain noon)', function() {
        const expressions = ['0', '0', '22-2', '1', '1', '0'];
        const hours = conversion(expressions)[2].split(',').map(Number);
        expect(hours).toEqual([22, 23, 0, 1, 2]);
        expect(hours).not.toContain(12);
    });

    it('should step over a wrapped hour range in order (22-2/2)', function() {
        const expressions = ['0', '0', '22-2/2', '1', '1', '0'];
        const hours = conversion(expressions)[2].split(',').map(Number);
        expect(hours).toEqual([22, 0, 2]);
    });

    it('should wrap inverted minutes through the top of the hour (50-10)', function() {
        const expressions = ['0', '50-10', '0', '1', '1', '0'];
        const minutes = conversion(expressions)[1].split(',').map(Number);
        expect(minutes).toEqual([50,51,52,53,54,55,56,57,58,59,0,1,2,3,4,5,6,7,8,9,10]);
    });

    it('should wrap an inverted day-of-month range through the end of the month (28-2)', function() {
        const expressions = ['0', '0', '0', '28-2', '1', '0'];
        const days = conversion(expressions)[3].split(',').map(Number);
        expect(days).toEqual([28,29,30,31,1,2]);
    });

    it('should wrap an inverted month range through December (11-2)', function() {
        const expressions = ['0', '0', '0', '1', '11-2', '0'];
        const months = conversion(expressions)[4].split(',').map(Number);
        expect(months).toEqual([11,12,1,2]);
    });

    it('should wrap an inverted weekday range through the end of the week (5-1, Fri-Mon)', function() {
        const expressions = ['0', '0', '0', '1', '1', '5-1'];
        const weekdays = conversion(expressions)[5].split(',').map(Number);
        expect(weekdays).toEqual([5, 6, 0, 1]);
    });

    it('should wrap an inverted weekday range (6-0, Sat-Sun)', function() {
        const expressions = ['0', '0', '0', '1', '1', '6-0'];
        const weekdays = conversion(expressions)[5].split(',').map(Number);
        expect(weekdays).toEqual([6, 0]);
    });

    it('should leave an ascending weekday range 6-7 unwrapped (still Sat,Sun once 7 normalizes to 0)', function() {
        const expressions = ['0', '0', '0', '1', '1', '6-7'];
        const weekdays = conversion(expressions)[5].split(',').map(Number);
        expect(weekdays).toEqual([6, 7]);
    });

    it('should leave malformed multi-dash forms untouched', function() {
        // Only whole `n-n` / `n-n/step` tokens expand; mangling these into
        // valid-looking numbers is what let `1-2-3` slip past validation.
        expect(conversion(['1-2-3'])[0]).toBe('1-2-3');
        expect(conversion(['1-2-3-4'])[0]).toBe('1-2-3-4');
        expect(conversion(['L-3-5'])[0]).toBe('L-3-5');
    });

    it('should leave a non-positive step untouched (no infinite loop)', function() {
        expect(conversion(['1-5/0'])[0]).toBe('1-5/0');
    });
});
