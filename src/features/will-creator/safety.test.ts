import { describe, expect, it } from 'vitest';
import { SAMPLE_KEYS, normalizePubkeyHex, usesDisallowedSampleKey } from './safety';

describe('Will Creator Safety Helpers', () => {
  it('normalizes pubkeys for case-insensitive comparison', () => {
    expect(normalizePubkeyHex(`  ${SAMPLE_KEYS.owner.toUpperCase()}  `)).toBe(SAMPLE_KEYS.owner);
  });

  it('detects sample owner key in owner field', () => {
    expect(usesDisallowedSampleKey(SAMPLE_KEYS.owner, SAMPLE_KEYS.beneficiary)).toBe(true);
  });

  it('detects sample beneficiary key in beneficiary field', () => {
    const owner = '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    expect(usesDisallowedSampleKey(owner, SAMPLE_KEYS.beneficiary)).toBe(true);
  });

  it('detects swapped sample keys across fields', () => {
    expect(usesDisallowedSampleKey(SAMPLE_KEYS.beneficiary, SAMPLE_KEYS.owner)).toBe(true);
  });

  it('does not flag non-sample keys', () => {
    const owner = '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const beneficiary = '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    expect(usesDisallowedSampleKey(owner, beneficiary)).toBe(false);
  });
});
