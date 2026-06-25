import validate from './pattern-validation';

describe('pattern-validation', function() {
    describe('validate day of month', function() {
        it('should fail with invalid day of month', function() {
            expect(() => {
                validate('* * 32 * *');
            }).toThrow('32 is a invalid expression for day of month');
        });

        it('should not fail with valid day of month', function() {
            expect(() => {
                validate('0 * * 15 * *');
            }).not.toThrow();
        });

        it('should not fail with * for day of month', function() {
            expect(() => {
                validate('* * * * * *');
            }).not.toThrow();
        });

        it('should not fail with */2 for day of month', function() {
            expect(() => {
                validate('* * */2 * *');
            }).not.toThrow();
        });

        it('should not fail with L (last day of month)', function() {
            expect(() => {
                validate('0 0 12 L * *');
            }).not.toThrow();
        });

        it('should not fail with lowercase l', function() {
            expect(() => {
                validate('0 0 12 l * *');
            }).not.toThrow();
        });

        it('should not fail with L combined with explicit days', function() {
            expect(() => {
                validate('0 0 12 15,L * *');
            }).not.toThrow();
        });

        it('should fail with L outside the day-of-month field', function() {
            expect(() => {
                validate('0 L * * * *');
            }).toThrow('L is a invalid expression for minute');
        });

        it('should not fail with nW (nearest weekday)', function() {
            expect(() => {
                validate('0 0 12 15W * *');
            }).not.toThrow();
            expect(() => {
                validate('0 0 12 1W * *');
            }).not.toThrow();
        });

        it('should not fail with LW (last weekday of month)', function() {
            expect(() => {
                validate('0 0 12 LW * *');
            }).not.toThrow();
        });

        it('should not fail with lowercase nW / lw', function() {
            expect(() => {
                validate('0 0 12 15w * *');
            }).not.toThrow();
            expect(() => {
                validate('0 0 12 lw * *');
            }).not.toThrow();
        });

        it('should not fail with a list of W tokens', function() {
            expect(() => {
                validate('0 0 12 1W,LW * *');
            }).not.toThrow();
        });

        it('should fail with W in a range', function() {
            expect(() => {
                validate('0 0 12 1-15W * *');
            }).toThrow('1-15W is a invalid expression for day of month');
        });

        it('should fail with W combined with a step', function() {
            expect(() => {
                validate('0 0 12 15W/2 * *');
            }).toThrow('15W/2 is a invalid expression for day of month');
        });

        it('should fail with an out-of-range nW (0W / 32W)', function() {
            expect(() => {
                validate('0 0 12 0W * *');
            }).toThrow('0W is a invalid expression for day of month');
            expect(() => {
                validate('0 0 12 32W * *');
            }).toThrow('32W is a invalid expression for day of month');
        });

        it('should fail with a malformed W token (bare W / WL / 15WW)', function() {
            expect(() => {
                validate('0 0 12 W * *');
            }).toThrow('W is a invalid expression for day of month');
            expect(() => {
                validate('0 0 12 WL * *');
            }).toThrow('WL is a invalid expression for day of month');
            expect(() => {
                validate('0 0 12 15WW * *');
            }).toThrow('15WW is a invalid expression for day of month');
        });

        it('should fail with W outside the day-of-month field', function() {
            expect(() => {
                validate('0 0 12 * * 5W');
            }).toThrow('5W is a invalid expression for week day');
        });

        it('should not fail with L-n (offset from the last day)', function() {
            expect(() => {
                validate('0 0 12 L-3 * *');
            }).not.toThrow();
            expect(() => {
                validate('0 0 12 L-30 * *');
            }).not.toThrow();
            expect(() => {
                validate('0 0 12 l-1 * *');
            }).not.toThrow();
        });

        it('should not fail with L-n combined with explicit days', function() {
            expect(() => {
                validate('0 0 12 1,L-3 * *');
            }).not.toThrow();
        });

        it('should fail with an out-of-range L-n (L-0 / L-31 / L-40)', function() {
            expect(() => {
                validate('0 0 12 L-0 * *');
            }).toThrow('L-0 is a invalid expression for day of month');
            expect(() => {
                validate('0 0 12 L-31 * *');
            }).toThrow('L-31 is a invalid expression for day of month');
            expect(() => {
                validate('0 0 12 L-40 * *');
            }).toThrow('L-40 is a invalid expression for day of month');
        });

        it('should fail with L-n outside the day-of-month field', function() {
            expect(() => {
                validate('0 0 12 * * L-3');
            }).toThrow('L-3 is a invalid expression for week day');
        });
    });

    describe('validate ? (no-specific-value alias)', function() {
        it('should accept ? in the day-of-month field', function() {
            expect(() => {
                validate('0 0 12 ? * 1');
            }).not.toThrow();
        });

        it('should accept ? in the day-of-week field', function() {
            expect(() => {
                validate('0 0 12 15 * ?');
            }).not.toThrow();
        });

        it('should accept ? in both day fields', function() {
            expect(() => {
                validate('0 0 12 ? * ?');
            }).not.toThrow();
        });

        it('should fail with ? combined in a list', function() {
            expect(() => {
                validate('0 0 12 1,? * *');
            }).toThrow('1,? is a invalid expression for day of month');
        });

        it('should fail with ? outside the day fields', function() {
            expect(() => {
                validate('0 ? * * * *');
            }).toThrow('? is a invalid expression for minute');
            expect(() => {
                validate('0 0 12 * ? *');
            }).toThrow('? is a invalid expression for month');
        });
    });

    describe('validate week day', function() {
        it('should not fail with <weekday>L (last weekday of month)', function() {
            expect(() => {
                validate('0 0 12 * * 5L');
            }).not.toThrow();
        });

        it('should not fail with 0L / 7L (last Sunday)', function() {
            expect(() => {
                validate('0 0 12 * * 0L');
            }).not.toThrow();
            expect(() => {
                validate('0 0 12 * * 7L');
            }).not.toThrow();
        });

        it('should not fail with a lowercase weekday L', function() {
            expect(() => {
                validate('0 0 12 * * 5l');
            }).not.toThrow();
        });

        it('should not fail with <weekday>L combined with explicit weekdays', function() {
            expect(() => {
                validate('0 0 12 * * 5L,1');
            }).not.toThrow();
        });

        it('should fail with an out-of-range weekday L (8L)', function() {
            expect(() => {
                validate('0 0 12 * * 8L');
            }).toThrow('8L is a invalid expression for week day');
        });

        it('should fail with a reversed token (L5)', function() {
            expect(() => {
                validate('0 0 12 * * L5');
            }).toThrow('L5 is a invalid expression for week day');
        });

        it('should fail with a bare L in the week-day field', function() {
            expect(() => {
                validate('0 0 12 * * L');
            }).toThrow('L is a invalid expression for week day');
        });
    });
});
