import { describe, expect, it } from 'vitest';
import { parseTipHeight, toSafeInteger } from './utils';

describe('explorer numeric parsing', () => {
  it('accepts non-negative safe integer amounts', () => {
    expect(toSafeInteger(0)).toBe(0);
    expect(toSafeInteger(100_000_000)).toBe(100_000_000);
  });

  it('rejects malformed or out-of-range amounts', () => {
    expect(toSafeInteger(-1)).toBe(0);
    expect(toSafeInteger(1.5)).toBe(0);
    expect(toSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(0);
    expect(toSafeInteger(2_100_000_000_000_001)).toBe(0);
  });

  it('requires the entire tip-height response to be an integer', () => {
    expect(parseTipHeight(' 123 ')).toBe(123);
    expect(parseTipHeight('123abc')).toBeUndefined();
    expect(parseTipHeight('-1')).toBeUndefined();
    expect(parseTipHeight('1.5')).toBeUndefined();
  });
});
