export default ( () => {
    // A range is only expanded when a whole comma-separated token is exactly
    // `n-n` or `n-n/step`. Matching per token (rather than anywhere in the
    // field) stops malformed forms like `1-2-3` or `L-3-5` from being mangled
    // into something that looks valid; they are left untouched so validation
    // rejects them. By this stage names and `*` have already been converted, so
    // every legitimate range is numeric.
    const rangeRegEx = /^(\d+)-(\d+)(?:\/(\d+))?$/;

    // Bounds per expression index (second, minute, hour, day-of-month, month,
    // day-of-week), used to wrap an inverted range through the field's edge
    // instead of swapping it.
    const FIELD_BOUNDS = [
        { min: 0, max: 59 },
        { min: 0, max: 59 },
        { min: 0, max: 23 },
        { min: 1, max: 31 },
        { min: 1, max: 12 },
        { min: 0, max: 6 },
    ];

    function expandRange(initTxt, endTxt, stepTxt, bounds) {
        const step = parseInt(stepTxt, 10);
        // A non-positive step would never terminate; leave the token for
        // validation to reject.
        if (!(step >= 1)) return `${initTxt}-${endTxt}/${stepTxt}`;

        const first = parseInt(initTxt, 10);
        const last = parseInt(endTxt, 10);

        const numbers: number[] = [];
        if (first <= last) {
            for (let i = first; i <= last; i += step) {
                numbers.push(i);
            }
            return numbers.join();
        }

        // Inverted range: wrap through the field's upper bound back to its
        // lower bound instead of swapping (e.g. hours `22-2` -> 22,23,0,1,2).
        const { min, max } = bounds;
        const size = max - min + 1;
        const span = ((last - first) % size + size) % size;
        for (let offset = 0; offset <= span; offset += step) {
            let value = first + offset;
            if (value > max) value -= size;
            numbers.push(value);
        }
        return numbers.join();
    }

    function convertRange(expression, bounds){
        return expression
            .split(',')
            .map((token) => {
                const match = rangeRegEx.exec(token.trim());
                return match ? expandRange(match[1], match[2], match[3] || '1', bounds) : token;
            })
            .join();
    }

    function convertAllRanges(expressions){
        for(let i = 0; i < expressions.length; i++){
            expressions[i] = convertRange(expressions[i], FIELD_BOUNDS[i]);
        }
        return expressions;
    }

    return convertAllRanges;
})();
