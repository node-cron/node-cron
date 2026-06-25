import { parse, validateDetailed } from './pattern-validation';

describe('validateDetailed', function () {
  it('returns valid with the decomposed fields for a valid expression', function () {
    const result = validateDetailed('0 30 9 * * 1-5');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.fields?.second).toEqual([0]);
    expect(result.fields?.minute).toEqual([30]);
    expect(result.fields?.hour).toEqual([9]);
    expect(result.fields?.dayOfWeek).toEqual([1, 2, 3, 4, 5]);
  });

  it('defaults the seconds field for a 5-field expression', function () {
    const result = validateDetailed('30 9 * * *');
    expect(result.valid).toBe(true);
    expect(result.fields?.second).toEqual([0]);
    expect(result.fields?.minute).toEqual([30]);
  });

  it('keeps the L token in day-of-month', function () {
    const result = validateDetailed('0 0 12 L * *');
    expect(result.valid).toBe(true);
    expect(result.fields?.dayOfMonth as any[]).toContain('L');
  });

  it('keeps the <weekday>L token in day-of-week', function () {
    const result = validateDetailed('0 0 12 * * 5L');
    expect(result.valid).toBe(true);
    expect(result.fields?.dayOfWeek as any[]).toContain('5L');
  });

  it('normalises 7L to 0L in day-of-week', function () {
    const result = validateDetailed('0 0 12 * * 7L');
    expect(result.valid).toBe(true);
    expect(result.fields?.dayOfWeek as any[]).toContain('0L');
  });

  it('keeps the nW / LW tokens in day-of-month', function () {
    const result = validateDetailed('0 0 12 15W,LW * *');
    expect(result.valid).toBe(true);
    expect(result.fields?.dayOfMonth as any[]).toEqual(expect.arrayContaining(['15W', 'LW']));
  });

  it('reports W used in a range as invalid day-of-month', function () {
    const result = validateDetailed('0 0 12 1-15W * *');
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('dayOfMonth');
    expect(result.errors[0].value).toBe('1-15W');
  });

  it('keeps the L-n token in day-of-month', function () {
    const result = validateDetailed('0 0 12 L-3 * *');
    expect(result.valid).toBe(true);
    expect(result.fields?.dayOfMonth as any[]).toContain('L-3');
  });

  it('reports an out-of-range L-n token', function () {
    const result = validateDetailed('0 0 12 L-40 * *');
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('dayOfMonth');
    expect(result.errors[0].value).toBe('L-40');
  });

  it('reports an invalid <weekday>L token', function () {
    const result = validateDetailed('0 0 12 * * 8L');
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('dayOfWeek');
  });

  it('reports an out-of-range field with its name and value', function () {
    const result = validateDetailed('0 0 99 * * *'); // 6 fields: hour = 99
    expect(result.valid).toBe(false);
    expect(result.fields).toBeUndefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe('hour');
    expect(result.errors[0].value).toBe('99');
    expect(result.errors[0].message).toMatch(/99/);
  });

  it('collects errors from multiple invalid fields', function () {
    const result = validateDetailed('99 0 99 * * *'); // bad second and bad hour
    expect(result.valid).toBe(false);
    const fields = result.errors.map(e => e.field);
    expect(fields).toEqual(expect.arrayContaining(['second', 'hour']));
  });

  it('rejects illegal characters', function () {
    const result = validateDetailed('0 0 12 * * $');
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('expression');
  });

  it('rejects a wrong number of fields', function () {
    const result = validateDetailed('* * *');
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('expression');
    expect(result.errors[0].message).toMatch(/5 or 6 fields/);
  });

  it('rejects a non-string', function () {
    const result = validateDetailed(123 as any);
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('expression');
  });
});

describe('parse', function () {
  it('returns the decomposed fields for a valid expression', function () {
    const fields = parse('0 30 9 * * *');
    expect(fields.minute).toEqual([30]);
    expect(fields.hour).toEqual([9]);
  });

  it('throws with a useful message for an invalid expression', function () {
    expect(() => parse('0 0 99 * * *')).toThrow(/99 is a invalid expression for hour/);
  });
});
