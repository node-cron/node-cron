import convertExpression from '../conversion/index';

const validationRegex = /^(?:\d+|\*|\*\/\d+)$/;

/**
 * @param {string} expression The Cron-Job expression.
 * @param {number} min The minimum value.
 * @param {number} max The maximum value.
 * @returns {boolean}
 */
function isValidExpression(expression, min, max) {
    const options = expression;

    for (const option of options) {
        const optionAsInt = parseInt(option, 10);

        if (
            (!Number.isNaN(optionAsInt) &&
                (optionAsInt < min || optionAsInt > max)) ||
            !validationRegex.test(option)
        )
            return false;
    }

    return true;
}

/**
 * @param {string} expression The Cron-Job expression.
 * @returns {boolean}
 */
function isInvalidSecond(expression) {
    return !isValidExpression(expression, 0, 59);
}

/**
 * @param {string} expression The Cron-Job expression.
 * @returns {boolean}
 */
function isInvalidMinute(expression) {
    return !isValidExpression(expression, 0, 59);
}

/**
 * @param {string} expression The Cron-Job expression.
 * @returns {boolean}
 */
function isInvalidHour(expression) {
    return !isValidExpression(expression, 0, 23);
}

/**
 * @param {string} expression The Cron-Job expression.
 * @returns {boolean}
 */
function isInvalidDayOfMonth(expression) {
    // 'L' (last day of the month) is a valid token in this field only; the
    // remaining values must still be valid day numbers.
    const days = expression.filter((value) => value !== 'L');
    return !isValidExpression(days, 1, 31);
}

/**
 * @param {string} expression The Cron-Job expression.
 * @returns {boolean}
 */
function isInvalidMonth(expression) {
    return !isValidExpression(expression, 1, 12);
}

/**
 * @param {string} expression The Cron-Job expression.
 * @returns {boolean}
 */
function isInvalidWeekDay(expression) {
    return !isValidExpression(expression, 0, 7);
}

/**
 * @param {string[]} patterns The Cron-Job expression patterns.
 * @param {string[]} executablePatterns The executable Cron-Job expression
 * patterns.
 * @returns {void}
 */
function validateFields(patterns, executablePatterns) {
    if (isInvalidSecond(executablePatterns[0]))
        throw new Error(`${patterns[0]} is a invalid expression for second`);

    if (isInvalidMinute(executablePatterns[1]))
        throw new Error(`${patterns[1]} is a invalid expression for minute`);

    if (isInvalidHour(executablePatterns[2]))
        throw new Error(`${patterns[2]} is a invalid expression for hour`);

    if (isInvalidDayOfMonth(executablePatterns[3]))
        throw new Error(
            `${patterns[3]} is a invalid expression for day of month`
        );

    if (isInvalidMonth(executablePatterns[4]))
        throw new Error(`${patterns[4]} is a invalid expression for month`);

    if (isInvalidWeekDay(executablePatterns[5]))
        throw new Error(`${patterns[5]} is a invalid expression for week day`);
}

// Field metadata reused by the detailed (non-throwing) API below. Order matches
// the 6-field expression: second minute hour day-of-month month day-of-week.
const FIELDS = [
    { key: 'second', label: 'second', invalid: isInvalidSecond },
    { key: 'minute', label: 'minute', invalid: isInvalidMinute },
    { key: 'hour', label: 'hour', invalid: isInvalidHour },
    { key: 'dayOfMonth', label: 'day of month', invalid: isInvalidDayOfMonth },
    { key: 'month', label: 'month', invalid: isInvalidMonth },
    { key: 'dayOfWeek', label: 'week day', invalid: isInvalidWeekDay },
];

export interface CronFieldError {
    /** The field name, or `'expression'` for whole-expression problems. */
    field: string;
    value?: string;
    message: string;
}

export interface ParsedFields {
    second: number[];
    minute: number[];
    hour: number[];
    dayOfMonth: (number | string)[];
    month: number[];
    dayOfWeek: number[];
}

export interface DetailedValidation {
    valid: boolean;
    /** Present only when `valid` is true. */
    fields?: ParsedFields;
    errors: CronFieldError[];
}

/**
 * Validates an expression and returns a structured result with every error
 * (field name, offending value, reason) instead of throwing on the first.
 * Useful for tooling, editors and DX.
 */
export function validateDetailed(pattern: string): DetailedValidation {
    if (typeof pattern !== 'string')
        return { valid: false, errors: [{ field: 'expression', message: 'pattern must be a string' }] };

    if (!/^[a-zA-Z0-9-*/, ]+$/.test(pattern))
        return { valid: false, errors: [{ field: 'expression', value: pattern, message: 'pattern includes illegal characters' }] };

    const raw = pattern.replace(/\s{2,}/g, ' ').trim().split(' ');
    if (raw.length !== 5 && raw.length !== 6)
        return { valid: false, errors: [{ field: 'expression', value: pattern, message: `expected 5 or 6 fields but got ${raw.length}` }] };

    const patterns = raw.length === 5 ? ['0', ...raw] : raw;
    const executable = convertExpression(pattern);

    const errors: CronFieldError[] = [];
    FIELDS.forEach((f, i) => {
        if (f.invalid(executable[i]))
            errors.push({ field: f.key, value: patterns[i], message: `${patterns[i]} is a invalid expression for ${f.label}` });
    });

    if (errors.length) return { valid: false, errors };

    return {
        valid: true,
        errors: [],
        fields: {
            second: executable[0],
            minute: executable[1],
            hour: executable[2],
            dayOfMonth: executable[3],
            month: executable[4],
            dayOfWeek: executable[5],
        },
    };
}

/**
 * Parses an expression into its decomposed fields, or throws an Error with a
 * useful message (which field, which value) for the first problem found.
 */
export function parse(pattern: string): ParsedFields {
    const result = validateDetailed(pattern);
    if (!result.valid) throw new Error(result.errors[0].message);
    return result.fields as ParsedFields;
}

/**
 * Validates a Cron-Job expression pattern.
 *
 * @param {string} pattern The Cron-Job expression pattern.
 * @returns {void}
 */
function validate(pattern) {
    if (typeof pattern !== 'string')
        throw new TypeError('pattern must be a string!');
    const charRegex = new RegExp('^[a-zA-Z0-9-*/, ]+$');
    if (!charRegex.test(pattern))
        throw new TypeError('pattern includes illegal characters!');

    const patterns = pattern.split(' ');
    const executablePatterns = convertExpression(pattern);

    if (patterns.length === 5) patterns.unshift('0');

    validateFields(patterns, executablePatterns);
}

export default validate;
