import monthNamesConversion from './month-names-conversion';
import weekDayNamesConversion from './week-day-names-conversion';
import convertAsterisksToRanges from './asterisk-to-range-conversion';
import convertRanges from './range-conversion';

export default (() => {

    function appendSeccondExpression(expressions){
        if(expressions.length === 5){
            return ['0'].concat(expressions);
        }
        return expressions;
    }

    function removeSpaces(str) {
        return str.replace(/\s{2,}/g, ' ').trim();
    }

    // Function that takes care of normalization.
    function normalizeIntegers(expressions) {
        for (let i=0; i < expressions.length; i++){
            const numbers = expressions[i].split(',');
            for (let j=0; j<numbers.length; j++){
                // Keep the `L` (last day of month) token as a literal; it has no
                // fixed numeric value. It is only meaningful in the day-of-month
                // field, where validation accepts it; elsewhere it stays a token
                // that no value matches and that validation rejects.
                //
                // Keep the `<weekday>#<nth>` token (e.g. `2#3`, "the 3rd Tuesday")
                // as a literal too. It is only meaningful in the day-of-week
                // field; the matcher resolves it against the actual date.
                const value = String(numbers[j]).trim();
                if (/^l$/i.test(value)) {
                    numbers[j] = 'L';
                } else if (value.indexOf('#') !== -1) {
                    // Any `#`-bearing entry is kept verbatim so the day-of-week
                    // validator can accept the valid `<weekday>#<nth>` form and
                    // reject malformed ones (rather than parseInt truncating
                    // `2#6` to `2`).
                    numbers[j] = value;
                } else {
                    numbers[j] = parseInt(numbers[j]);
                }
            }
            expressions[i] = numbers;
        }
        return expressions;
    }

    /*
   * The node-cron core allows only numbers (including multiple numbers e.g 1,2).
   * This module is going to translate the month names, week day names and ranges
   * to integers relatives.
   *
   * Month names example:
   *  - expression 0 1 1 January,Sep *
   *  - Will be translated to 0 1 1 1,9 *
   *
   * Week day names example:
   *  - expression 0 1 1 2 Monday,Sat
   *  - Will be translated to 0 1 1 1,5 *
   *
   * Ranges example:
   *  - expression 1-5 * * * *
   *  - Will be translated to 1,2,3,4,5 * * * *
   */
    function interprete(expression){
        let expressions = removeSpaces(`${expression}`).split(' ');
        expressions = appendSeccondExpression(expressions);
        expressions[4] = monthNamesConversion(expressions[4]);
        expressions[5] = weekDayNamesConversion(expressions[5]);
        expressions = convertAsterisksToRanges(expressions);
        expressions = convertRanges(expressions);

        expressions = normalizeIntegers(expressions);

        return expressions;
    }

    return interprete;
})();
