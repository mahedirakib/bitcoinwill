import { describe, expect, it } from 'vitest';
import { buildPlan } from '@/lib/bitcoin/planEngine';
import { parseWizardDraft } from './draftState';

describe('wizard draft restore helpers', () => {
  const canonicalInput = {
    network: 'testnet' as const,
    inheritance_type: 'timelock_recovery' as const,
    owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
    beneficiary_pubkey: '02b634f19b165239105436a5c17e3371901c5651581452a3299787474747474747',
    locktime_blocks: 144,
    address_type: 'p2tr' as const,
    recovery_method: 'single' as const,
  };

  // Drafts without a valid (recent) timestamp are now treated as expired, so
  // every restorable payload must carry a fresh timestamp.
  const freshTimestamp = () => new Date().toISOString();

  it('returns null for malformed JSON payloads', () => {
    expect(parseWizardDraft('{this-is-not-json', 'testnet')).toBeNull();
  });

  it('returns null for invalid step payloads', () => {
    const payload = JSON.stringify({
      step: 'INVALID_STEP',
      timestamp: freshTimestamp(),
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
    const payload = JSON.stringify({ step: 'KEYS', timestamp: freshTimestamp() });
    expect(parseWizardDraft(payload, 'testnet')).toBeNull();
  });

  it('sanitizes restored input values to safe defaults', () => {
    const payload = JSON.stringify({
      step: 'TIMELOCK',
      timestamp: freshTimestamp(),
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
      timestamp: freshTimestamp(),
      input: {
        network: 'mainnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        beneficiary_pubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        locktime_blocks: 1_008,
        address_type: 'p2wsh',
        recovery_method: 'social',
        sss_config: { threshold: 3, total: 5 },
        plan_label: ' Family vault ',
        owner_key_origin: {
          device: 'trezor',
          derivation_path: "m/84'/0'/0'/0/0",
          fingerprint: 'A1B2C3D4',
        },
      },
    });

    const restored = parseWizardDraft(payload, 'testnet');
    expect(restored?.step).toBe('REVIEW');
    expect(restored?.input).toEqual({
      network: 'mainnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      beneficiary_pubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      locktime_blocks: 1_008,
      address_type: 'p2wsh',
      recovery_method: 'social',
      sss_config: { threshold: 3, total: 5 },
      plan_label: 'Family vault',
      owner_key_origin: {
        device: 'trezor',
        derivation_path: "m/84'/0'/0'/0/0",
        fingerprint: 'a1b2c3d4',
      },
    });
  });

  it('drops invalid optional configuration fields', () => {
    const payload = JSON.stringify({
      step: 'TYPE',
      timestamp: freshTimestamp(),
      input: {
        network: 'testnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        beneficiary_pubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        locktime_blocks: 144,
        address_type: 'legacy',
        recovery_method: 'social',
        sss_config: { threshold: 2, total: 5 },
        plan_label: '   ',
      },
    });

    const restored = parseWizardDraft(payload, 'testnet');
    expect(restored?.input).toEqual({
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      beneficiary_pubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      locktime_blocks: 144,
      recovery_method: 'social',
      sss_config: undefined,
      address_type: undefined,
      plan_label: undefined,
    });
  });

  it('does not restore social recovery share material from saved results', () => {
    const payload = JSON.stringify({
      step: 'RESULT',
      timestamp: freshTimestamp(),
      input: {
        network: 'testnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        beneficiary_pubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        locktime_blocks: 144,
        recovery_method: 'social',
        sss_config: { threshold: 2, total: 3 },
      },
      result: {
        descriptor: 'tr(abc,{def})',
        script_asm: 'OP_IF OP_CHECKSIG OP_ENDIF',
        script_hex: '51ac68',
        address: 'tb1pexamplevaultaddress000000000000000000000000000000000000',
        witness_script: '51ac68',
        network: 'testnet',
        address_type: 'p2tr',
        human_explanation: ['Vault Address: tb1pexamplevaultaddress000000000000000000000000000000000000'],
        social_recovery_kit: {
          config: { threshold: 2, total: 3 },
          shares: [
            { index: 1, share: 'a'.repeat(80) },
            { index: 2, share: 'b'.repeat(80) },
          ],
          instructions: ['Do not persist these with the draft.'],
        },
      },
    });

    const restored = parseWizardDraft(payload, 'testnet');

    expect(restored?.step).toBe('REVIEW');
    expect(restored?.result).toBeUndefined();
  });

  it('does not restore stripped social recovery results as completed plans', () => {
    const payload = JSON.stringify({
      step: 'RESULT',
      timestamp: freshTimestamp(),
      input: {
        network: 'testnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        beneficiary_pubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        locktime_blocks: 144,
        recovery_method: 'social',
        sss_config: { threshold: 2, total: 3 },
      },
      result: {
        descriptor: 'tr(abc,{def})',
        script_asm: 'OP_IF OP_CHECKSIG OP_ENDIF',
        script_hex: '51ac68',
        address: 'tb1pexamplevaultaddress000000000000000000000000000000000000',
        witness_script: '51ac68',
        network: 'testnet',
        address_type: 'p2tr',
        human_explanation: ['Vault Address: tb1pexamplevaultaddress000000000000000000000000000000000000'],
      },
    });

    const restored = parseWizardDraft(payload, 'testnet');

    expect(restored?.step).toBe('REVIEW');
    expect(restored?.result).toBeUndefined();
  });

  it('flags social-recovery drafts rolled back from RESULT so callers can warn', () => {
    const payload = JSON.stringify({
      step: 'RESULT',
      timestamp: freshTimestamp(),
      input: {
        network: 'testnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        beneficiary_pubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        locktime_blocks: 144,
        recovery_method: 'social',
        sss_config: { threshold: 2, total: 3 },
      },
      result: {
        descriptor: 'tr(abc,{def})',
        script_asm: 'OP_IF OP_CHECKSIG OP_ENDIF',
        script_hex: '51ac68',
        address: 'tb1pexamplevaultaddress000000000000000000000000000000000000',
        witness_script: '51ac68',
        network: 'testnet',
        address_type: 'p2tr',
        human_explanation: ['x'],
      },
    });

    const restored = parseWizardDraft(payload, 'testnet');
    expect(restored?.step).toBe('REVIEW');
    expect(restored?.socialResultDropped).toBe(true);
  });

  it('does not flag non-social drafts rolled back from RESULT (regeneration is deterministic)', () => {
    const result = buildPlan(canonicalInput);
    const payload = JSON.stringify({
      step: 'RESULT',
      timestamp: freshTimestamp(),
      input: canonicalInput,
      result: { ...result, address: 'tb1qnottherealvaultaddressxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    });

    const restored = parseWizardDraft(payload, 'testnet');
    expect(restored?.step).toBe('REVIEW');
    expect(restored?.socialResultDropped).toBeUndefined();
  });

  it('does not flag social drafts that were never on the RESULT step', () => {
    const payload = JSON.stringify({
      step: 'REVIEW',
      timestamp: freshTimestamp(),
      input: {
        network: 'testnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        beneficiary_pubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        locktime_blocks: 144,
        recovery_method: 'social',
        sss_config: { threshold: 2, total: 3 },
      },
    });

    const restored = parseWizardDraft(payload, 'testnet');
    expect(restored?.step).toBe('REVIEW');
    expect(restored?.socialResultDropped).toBeUndefined();
  });

  it('restores canonical completed single-key draft results', () => {
    const result = buildPlan(canonicalInput);
    const payload = JSON.stringify({
      step: 'RESULT',
      timestamp: freshTimestamp(),
      input: canonicalInput,
      result,
    });

    const restored = parseWizardDraft(payload, 'testnet');

    expect(restored?.step).toBe('RESULT');
    expect(restored?.result?.address).toBe(result.address);
  });

  it('falls back to review when a completed draft result is missing', () => {
    const payload = JSON.stringify({
      step: 'RESULT',
      timestamp: freshTimestamp(),
      input: canonicalInput,
    });

    const restored = parseWizardDraft(payload, 'testnet');

    expect(restored?.step).toBe('REVIEW');
    expect(restored?.result).toBeUndefined();
  });

  it('falls back to review when a completed draft result is tampered', () => {
    const result = buildPlan(canonicalInput);
    const payload = JSON.stringify({
      step: 'RESULT',
      timestamp: freshTimestamp(),
      input: canonicalInput,
      result: {
        ...result,
        address: 'tb1qnottherealvaultaddressxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      },
    });

    const restored = parseWizardDraft(payload, 'testnet');

    expect(restored?.step).toBe('REVIEW');
    expect(restored?.result).toBeUndefined();
  });

  it('treats a draft with a missing timestamp as expired', () => {
    const payload = JSON.stringify({
      step: 'TIMELOCK',
      input: {
        network: 'testnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
        beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
        locktime_blocks: 144,
      },
    });
    expect(parseWizardDraft(payload, 'testnet')).toBeNull();
  });

  it('treats a draft with a malformed timestamp as expired', () => {
    const payload = JSON.stringify({
      step: 'TIMELOCK',
      timestamp: 'not-a-date',
      input: {
        network: 'testnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
        beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
        locktime_blocks: 144,
      },
    });
    expect(parseWizardDraft(payload, 'testnet')).toBeNull();
  });

  it('treats a draft older than the expiry window as expired', () => {
    const expired = new Date(Date.now() - (60 * 60 * 1000 + 60_000)).toISOString();
    const payload = JSON.stringify({
      step: 'TIMELOCK',
      timestamp: expired,
      input: {
        network: 'testnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
        beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
        locktime_blocks: 144,
      },
    });
    expect(parseWizardDraft(payload, 'testnet')).toBeNull();
  });

  it('rejects a draft whose timestamp is far in the future', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const payload = JSON.stringify({
      step: 'TIMELOCK',
      timestamp: future,
      input: {
        network: 'testnet',
        inheritance_type: 'timelock_recovery',
        owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
        beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
        locktime_blocks: 144,
      },
    });
    expect(parseWizardDraft(payload, 'testnet')).toBeNull();
  });
});
