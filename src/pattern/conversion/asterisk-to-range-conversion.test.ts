import conversion from './asterisk-to-range-conversion';

describe('asterisk-to-range-conversion', function() {
    it('shuld convert * to ranges', function() {
        const expressions = '* * * * * *'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).toBe('0-59 0-59 0-23 1-31 1-12 0-6');
    });

    it('shuld convert * to ranges with step', function() {
      const expressions = '*/2 * * * * *'.split(' ');
      const expression = conversion(expressions).join(' ');
      expect(expression).toBe('0-59/2 0-59 0-23 1-31 1-12 0-6');
  });

    it('converts every asterisk token in a comma list, not just the first', function() {
        const expressions = '*/2,*/3 * * * * *'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).toBe('0-59/2,0-59/3 0-59 0-23 1-31 1-12 0-6');
    });

    it('converts a comma list mixing a bare asterisk with a stepped one', function() {
        const expressions = '*,*/15 * * * * *'.split(' ');
        const expression = conversion(expressions).join(' ');
        expect(expression).toBe('0-59,0-59/15 0-59 0-23 1-31 1-12 0-6');
    });
});
