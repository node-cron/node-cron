import validate from './pattern-validation';

describe('pattern-validation', function() {
    describe('validate hour', function() {
        it('should fail with invalid hour', function() {
            expect(() => {
                validate('* 25 * * *');
            }).toThrow('25 is a invalid expression for hour');
        });

        it('should not fail with valid hour', function() {
            expect(() => {
                validate('* 12 * * *');
            }).not.toThrow();
        });

        it('should not fail with * for hour', function() {
            expect(() => {
                validate('* * * * * *');
            }).not.toThrow();
        });

        it('should not fail with */2 for hour', function() {
            expect(() => {
                validate('* */2 * * *');
            }).not.toThrow();
        });

        it('should accept range for hours', function() {
            expect(() => {
                validate('* 3-20 * * *');
            }).not.toThrow();
        });
    });
});
