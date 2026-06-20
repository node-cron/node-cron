import { assert } from 'chai';
import { parse, validateDetailed } from './pattern-validation';

describe('validateDetailed', function () {
  it('returns valid with the decomposed fields for a valid expression', function () {
    const result = validateDetailed('0 30 9 * * 1-5');
    assert.isTrue(result.valid);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.fields?.second, [0]);
    assert.deepEqual(result.fields?.minute, [30]);
    assert.deepEqual(result.fields?.hour, [9]);
    assert.deepEqual(result.fields?.dayOfWeek, [1, 2, 3, 4, 5]);
  });

  it('defaults the seconds field for a 5-field expression', function () {
    const result = validateDetailed('30 9 * * *');
    assert.isTrue(result.valid);
    assert.deepEqual(result.fields?.second, [0]);
    assert.deepEqual(result.fields?.minute, [30]);
  });

  it('keeps the L token in day-of-month', function () {
    const result = validateDetailed('0 0 12 L * *');
    assert.isTrue(result.valid);
    assert.include(result.fields?.dayOfMonth as any[], 'L');
  });

  it('keeps the <weekday>L token in day-of-week', function () {
    const result = validateDetailed('0 0 12 * * 5L');
    assert.isTrue(result.valid);
    assert.include(result.fields?.dayOfWeek as any[], '5L');
  });

  it('normalises 7L to 0L in day-of-week', function () {
    const result = validateDetailed('0 0 12 * * 7L');
    assert.isTrue(result.valid);
    assert.include(result.fields?.dayOfWeek as any[], '0L');
  });

  it('reports an invalid <weekday>L token', function () {
    const result = validateDetailed('0 0 12 * * 8L');
    assert.isFalse(result.valid);
    assert.equal(result.errors[0].field, 'dayOfWeek');
  });

  it('reports an out-of-range field with its name and value', function () {
    const result = validateDetailed('0 0 99 * * *'); // 6 fields: hour = 99
    assert.isFalse(result.valid);
    assert.isUndefined(result.fields);
    assert.lengthOf(result.errors, 1);
    assert.equal(result.errors[0].field, 'hour');
    assert.equal(result.errors[0].value, '99');
    assert.match(result.errors[0].message, /99/);
  });

  it('collects errors from multiple invalid fields', function () {
    const result = validateDetailed('99 0 99 * * *'); // bad second and bad hour
    assert.isFalse(result.valid);
    const fields = result.errors.map(e => e.field);
    assert.includeMembers(fields, ['second', 'hour']);
  });

  it('rejects illegal characters', function () {
    const result = validateDetailed('0 0 12 * * $');
    assert.isFalse(result.valid);
    assert.equal(result.errors[0].field, 'expression');
  });

  it('rejects a wrong number of fields', function () {
    const result = validateDetailed('* * *');
    assert.isFalse(result.valid);
    assert.equal(result.errors[0].field, 'expression');
    assert.match(result.errors[0].message, /5 or 6 fields/);
  });

  it('rejects a non-string', function () {
    const result = validateDetailed(123 as any);
    assert.isFalse(result.valid);
    assert.equal(result.errors[0].field, 'expression');
  });
});

describe('parse', function () {
  it('returns the decomposed fields for a valid expression', function () {
    const fields = parse('0 30 9 * * *');
    assert.deepEqual(fields.minute, [30]);
    assert.deepEqual(fields.hour, [9]);
  });

  it('throws with a useful message for an invalid expression', function () {
    assert.throws(() => parse('0 0 99 * * *'), /99 is a invalid expression for hour/);
  });
});
