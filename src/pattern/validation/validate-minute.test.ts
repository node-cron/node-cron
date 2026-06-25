import validate from './pattern-validation';

describe('pattern-validation', function() {
    describe('validate minutes', function() {
        it('should fail with invalid minute', function() {
            expect(() => {
                validate('63 * * * *');
            }).toThrow('63 is a invalid expression for minute');
        });

        it('should not fail with valid minute', function() {
            expect(() => {
                validate('30 * * * *');
            }).not.toThrow();
        });

        it('should not fail with *', function() {
            expect(() => {
                validate('* * * * *');
            }).not.toThrow();
        });

        it('should not fail with */2', function() {
            expect(() => {
                validate('*/2 * * * *');
            }).not.toThrow();
        });
    });
});
