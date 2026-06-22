import convertExpression from '../conversion/index';
import { isNthWeekdayToken } from '../../time/day-of-week';

const validationRegex = /^(?:\d+|\*|\*\/\d+)$/;

// Characters allowed in a raw expression. `#` is permitted for the day-of-week
// `<weekday>#<nth>` token and `?` for the Quartz no-specific-value alias in the
// day fields; field-level validation rejects either elsewhere.
const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9-*/,#? ]+$/;

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
// `nW` / `LW` (nearest weekday) tokens, valid in the day-of-month field only.
const DAY_OF_MONTH_W_TOKEN = /^(\d{1,2}|L)W$/i;
// `L-n` (n days before the last day of the month), valid in day-of-month only.
const DAY_OF_MONTH_OFFSET_TOKEN = /^L-(\d{1,2})$/i;

function isInvalidDayOfMonth(expression) {
    // 'L' (last day of the month), the `nW` / `LW` (nearest weekday) tokens and
    // the `L-n` (offset from the last day) form are valid in this field only;
    // the remaining values must still be valid day numbers. Out-of-range forms
    // (e.g. `0W`, `32W`, `L-0`, `L-40`) are left in so the numeric check below
    // rejects them. The largest meaningful offset is 30 (`L-30` is day 1 of a
    // 31-day month); anything larger can never resolve to a real day.
    const days = expression.filter((value) => {
        if (value === 'L') return false;
        const weekday = DAY_OF_MONTH_W_TOKEN.exec(String(value));
        if (weekday) {
            if (weekday[1] === 'L') return false;
            const target = parseInt(weekday[1], 10);
            return target < 1 || target > 31;
        }
        const offset = DAY_OF_MONTH_OFFSET_TOKEN.exec(String(value));
        if (offset) {
            const n = parseInt(offset[1], 10);
            return n < 1 || n > 30;
        }
        return true;
    });
    return !isValidExpression(days, 1, 31);
}

/**
 * Detects misuse of the `W` (nearest weekday) modifier in the RAW day-of-month
 * field, before range expansion destroys the information: `W` is only valid on a
 * single day number (`15W`) or on `L` (`LW`), optionally in a comma list
 * (`1W,15W`). Ranges and steps (`1-15W`, `15W/2`) and malformed forms are
 * rejected. Runs on the unexpanded string because `convertRanges` turns
 * `1-15W` into `1,2,...,15W`, which would otherwise look valid.
 *
 * @param {string} rawDayOfMonth The raw day-of-month field.
 * @returns {boolean}
 */
function hasInvalidWModifier(rawDayOfMonth) {
    if (!/w/i.test(rawDayOfMonth)) return false;
    return rawDayOfMonth.split(',').some((token) => {
        const value = token.trim();
        if (!/w/i.test(value)) return false; // non-W entries handled elsewhere
        const match = DAY_OF_MONTH_W_TOKEN.exec(value);
        if (!match) return true; // range/step/malformed `W` usage
        if (match[1] === 'L' || match[1] === 'l') return false;
        const target = parseInt(match[1], 10);
        return target < 1 || target > 31;
    });
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
    // `<weekday>#<nth>` (e.g. `2#3`, "the 3rd Tuesday") and `<weekday>L` (e.g.
    // `5L`, "the last Friday") are valid tokens in this field only. The weekday
    // is 0-7 (0 or 7 = Sunday); the `#` occurrence is 1-5. Any remaining entries
    // must still be valid weekday numbers. Malformed forms (bare `L`, `L5`,
    // `8L`, `2#6`, ...) never become tokens, so they fall through and are
    // rejected.
    const days = expression.filter((value) => !isNthWeekdayToken(value) && !/^[0-7]L$/.test(value));
    return !isValidExpression(days, 0, 7);
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

    if (isInvalidDayOfMonth(executablePatterns[3]) || hasInvalidWModifier(patterns[3]))
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
    dayOfWeek: (number | string)[];
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

    if (!ALLOWED_CHARS_REGEX.test(pattern))
        return { valid: false, errors: [{ field: 'expression', value: pattern, message: 'pattern includes illegal characters' }] };

    const raw = pattern.replace(/\s{2,}/g, ' ').trim().split(' ');
    if (raw.length !== 5 && raw.length !== 6)
        return { valid: false, errors: [{ field: 'expression', value: pattern, message: `expected 5 or 6 fields but got ${raw.length}` }] };

    const patterns = raw.length === 5 ? ['0', ...raw] : raw;
    const executable = convertExpression(pattern);

    const errors: CronFieldError[] = [];
    FIELDS.forEach((f, i) => {
        const rawWMisuse = f.key === 'dayOfMonth' && hasInvalidWModifier(patterns[i]);
        if (f.invalid(executable[i]) || rawWMisuse)
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
    if (!ALLOWED_CHARS_REGEX.test(pattern))
        throw new TypeError('pattern includes illegal characters!');

    const patterns = pattern.split(' ');
    const executablePatterns = convertExpression(pattern);

    if (patterns.length === 5) patterns.unshift('0');

    validateFields(patterns, executablePatterns);
}

export default validate;
