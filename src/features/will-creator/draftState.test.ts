import { describe, expect, it } from 'vitest';
import { parseWizardDraft } from './draftState';

describe('wizard draft restore helpers', () => {
  it('returns null for malformed JSON payloads', () => {
    expect(parseWizardDraft('{this-is-not-json', 'testnet')).toBeNull();
  });

  it('returns null for invalid step payloads', () => {
    const payload = JSON.stringify({
      step: 'INVALID_STEP',
      input: {
        network: 'testnet',
        owner_pubkey: '',
        beneficiary_pubkey: '',
        locktime_blocks: 144,
      },
    });

    expect(parseWizardDraft(payload, 'testnet')).toBeNull();
  });

  it('returns null when input payload is missing or invalid', () => {
    const payload = JSON.stringify({ step: 'KEYS' });
    expect(parseWizardDraft(payload, 'testnet')).toBeNull();
  });

  it('sanitizes restored input values to safe defaults', () => {
    const payload = JSON.stringify({
      step: 'TIMELOCK',
      input: {
        network: 'signet',
        inheritance_type: 'legacy_recovery',
        owner_pubkey: ' 02E9634F19B165239105436A5C17E3371901C5651581452A329978747474747474 ',
        beneficiary_pubkey: 123,
        locktime_blocks: 999_999,
      },
    });

    const restored = parseWizardDraft(payload, 'testnet');
    expect(restored).not.toBeNull();
    expect(restored?.step).toBe('TIMELOCK');
    expect(restored?.input).toEqual({
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      beneficiary_pubkey: '',
      locktime_blocks: 144,
    });
  });

  it('preserves valid fields from restored drafts', () => {
    const payload = JSON.stringify({
      step: 'REVIEW',
      input: {
        network: 'mainnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        beneficiary_pubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        locktime_blocks: 1_008,
      },
    });

    const restored = parseWizardDraft(payload, 'testnet');
    expect(restored?.step).toBe('REVIEW');
    expect(restored?.input.network).toBe('mainnet');
    expect(restored?.input.locktime_blocks).toBe(1_008);
  });
});
