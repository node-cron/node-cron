import validate from './pattern-validation';

describe('pattern-validation',  function() {
    describe('validate month',  function() {
        it('should fail with invalid month',  function() {
            expect( () => {
                validate('* * * 13 *');
            }).toThrow('13 is a invalid expression for month');
        });

        it('should fail with invalid month name',  function() {
            expect( () => {
                validate('* * * foo *');
            }).toThrow('foo is a invalid expression for month');
        });

        it('should not fail with valid month',  function() {
            expect( () => {
                validate('* * * 10 *');
            }).not.toThrow();
        });

        it('should not fail with valid month name',  function() {
            expect( () => {
                validate('* * * September *');
            }).not.toThrow();
        });

        it('should not fail with * for month',  function() {
            expect( () => {
                validate('* * * * *');
            }).not.toThrow();
        });

        it('should not fail with */2 for month',  function() {
            expect( () => {
                validate('* * * */2 *');
            }).not.toThrow();
        });
    });
});
