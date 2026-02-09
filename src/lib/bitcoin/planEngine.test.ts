import { describe, it, expect } from 'vitest';
import { buildPlan } from './planEngine';
import { PlanInput } from './types';

describe('PlanEngine', () => {
  const sampleInput: PlanInput = {
    network: 'testnet',
    inheritance_type: 'timelock_recovery',
    owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474', // Mock valid pubkey
    beneficiary_pubkey: '03a634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
    locktime_blocks: 1000,
  };

  it('generates a deterministic SegWit address', () => {
    const result = buildPlan(sampleInput);
    expect(result.address).toBeDefined();
    expect(result.address.startsWith('tb1')).toBe(true);
    
    // Check determinism
    const secondResult = buildPlan(sampleInput);
    expect(result.address).toBe(secondResult.address);
  });

  it('throws error on invalid public key', () => {
    const badInput = { ...sampleInput, owner_pubkey: 'invalid' } as unknown as PlanInput;
    expect(() => buildPlan(badInput)).toThrow('Invalid Owner Public Key');
  });

  it('throws error on invalid locktime', () => {
    const badInput = { ...sampleInput, locktime_blocks: 0 };
    expect(() => buildPlan(badInput)).toThrow('Locktime must be between 1 and 65535');
  });

  it('contains human readable explanation', () => {
    const result = buildPlan(sampleInput);
    expect(result.human_explanation.length).toBeGreaterThan(0);
    expect(result.human_explanation[1]).toContain('Owner');
  });
});
