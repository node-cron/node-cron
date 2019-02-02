"use strict";
module.exports = (() => {
  function convertAsterisk(expression, replacement) {
    return expression.indexOf("*") !== -1
      ? expression.replace("*", replacement)
      : expression;
  }

  function convertAsterisksToRanges(expressions) {
    return expressions.map((expr, index) =>
      convertAsterisk(
        expr,
        ["0-59", "0-59", "0-23", "1-31", "1-12", "0-6"][index]
      )
    );
  }

  return convertAsterisksToRanges;
})();
