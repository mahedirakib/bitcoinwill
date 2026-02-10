import { describe, expect, it } from 'vitest';
import { calculateTime } from './utils';

describe('calculateTime', () => {
  it('never returns 0 hours for valid positive locktimes', () => {
    expect(calculateTime(1)).toBe('1 hour');
    expect(calculateTime(2)).toBe('1 hour');
  });

  it('returns pluralized hours when appropriate', () => {
    expect(calculateTime(12)).toBe('2 hours');
  });
});
