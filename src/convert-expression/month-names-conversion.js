"use strict";
module.exports = (() => {
  var months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ];
  var shortMonths = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec"
  ];

  function convertMonthName(expression, items) {
    items.forEach((item, index) => {
      expression = expression.replace(
        new RegExp(item, "gi"),
        parseInt(index, 10) + 1
      );
    });
    return expression;
  }

  function interprete(monthExpression) {
    monthExpression = convertMonthName(monthExpression, months);
    monthExpression = convertMonthName(monthExpression, shortMonths);
    return monthExpression;
  }

  return interprete;
})();
