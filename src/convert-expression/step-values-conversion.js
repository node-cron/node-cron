"use strict";

module.exports = (() => {
  function convertSteps(expressions) {
    const stepValuePattern = /^(.+)\/(\d+)$/;
    for (var i = 0; i < expressions.length; ++i) {
      const match = stepValuePattern.exec(expressions[i]);
      const isStepValue = match !== null && match.length > 0;
      if (isStepValue) {
        const values = match[1].split(",");
        const stepValues = [];
        const divider = parseInt(match[2], 10);
        values.forEach(v => {
          const value = parseInt(v, 10);
          if (value % divider === 0) {
            stepValues.push(value);
          }
        });
        expressions[i] = stepValues.join(",");
      }
    }
    return expressions;
  }

  return convertSteps;
})();
