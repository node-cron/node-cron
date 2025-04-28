export default ( () => {
    function replaceWithRange(expression, text, init, end, stepTxt) {
      console.log('replaceWithRange', expression, text, init, end, stepTxt);
        const step = parseInt(stepTxt);
        const numbers = [];
        let last = parseInt(end);
        let first = parseInt(init);

        if(first > last){
            last = parseInt(init);
            first = parseInt(end);
        }

        for(let i = first; i <= last; i += step) {
            numbers.push(i);
        }

        return expression.replace(new RegExp(text, 'i'), numbers.join());
    }

    function convertRange(expression){
        const rangeRegEx = /(\d+)-(\d+)(\/(\d+)|)/;
        let match = rangeRegEx.exec(expression);
        while(match !== null && match.length > 0){
            expression = replaceWithRange(expression, match[0], match[1], match[2], match[4] || '1');
            match = rangeRegEx.exec(expression);
        }
        return expression;
    }

    function convertAllRanges(expressions){
        for(let i = 0; i < expressions.length; i++){
            expressions[i] = convertRange(expressions[i]);
        }
        return expressions;
    }

    return convertAllRanges;
})();
