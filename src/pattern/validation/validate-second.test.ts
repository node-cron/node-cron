import validate from './pattern-validation';

describe('pattern-validation', function() {
    describe('validate seconds', function() {
        it('should fail with invalid second', function() {
            expect(() => {
                validate('63 * * * * *');
            }).toThrow('63 is a invalid expression for second');
        });

        it('should not fail with valid second', function() {
            expect(() => {
                validate('30 * * * * *');
            }).not.toThrow();
        });

        it('should not fail with * for second', function() {
            expect(() => {
                validate('* * * * * *');
            }).not.toThrow();
        });

        it('should not fail with */2 for second', function() {
            expect(() => {
                validate('*/2 * * * * *');
            }).not.toThrow();
        });
    });
});
