export default ( () => {
    // A range is only expanded when a whole comma-separated token is exactly
    // `n-n` or `n-n/step`. Matching per token (rather than anywhere in the
    // field) stops malformed forms like `1-2-3` or `L-3-5` from being mangled
    // into something that looks valid; they are left untouched so validation
    // rejects them. By this stage names and `*` have already been converted, so
    // every legitimate range is numeric.
    const rangeRegEx = /^(\d+)-(\d+)(?:\/(\d+))?$/;

    function expandRange(initTxt, endTxt, stepTxt) {
        const step = parseInt(stepTxt, 10);
        // A non-positive step would never terminate; leave the token for
        // validation to reject.
        if (!(step >= 1)) return `${initTxt}-${endTxt}/${stepTxt}`;

        let first = parseInt(initTxt, 10);
        let last = parseInt(endTxt, 10);
        if (first > last) {
            const swap = first;
            first = last;
            last = swap;
        }

        const numbers: number[] = [];
        for (let i = first; i <= last; i += step) {
            numbers.push(i);
        }
        return numbers.join();
    }

    function convertRange(expression){
        return expression
            .split(',')
            .map((token) => {
                const match = rangeRegEx.exec(token.trim());
                return match ? expandRange(match[1], match[2], match[3] || '1') : token;
            })
            .join();
    }

    function convertAllRanges(expressions){
        for(let i = 0; i < expressions.length; i++){
            expressions[i] = convertRange(expressions[i]);
        }
        return expressions;
    }

    return convertAllRanges;
})();
