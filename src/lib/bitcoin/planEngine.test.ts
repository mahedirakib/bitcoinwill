import { describe, it, expect } from 'vitest';
import { buildPlan } from './planEngine';
import { PlanInput } from './types';

describe('PlanEngine', () => {
  const validOwnerKey = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
  const validBeneficiaryKey = '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
  
  const sampleInput: PlanInput = {
    network: 'testnet',
    inheritance_type: 'timelock_recovery',
    owner_pubkey: validOwnerKey,
    beneficiary_pubkey: validBeneficiaryKey,
    locktime_blocks: 1000,
  };

  describe('buildPlan - Core Functionality', () => {
    it('generates a deterministic SegWit address', () => {
      const result = buildPlan(sampleInput);
      expect(result.address).toBeDefined();
      expect(result.address.startsWith('tb1')).toBe(true);
      
      // Check determinism - same input always produces same output
      const secondResult = buildPlan(sampleInput);
      expect(result.address).toBe(secondResult.address);
      expect(result.script_hex).toBe(secondResult.script_hex);
      expect(result.descriptor).toBe(secondResult.descriptor);
    });

    it('generates valid testnet address format', () => {
      const result = buildPlan(sampleInput);
      // Testnet native SegWit addresses start with 'tb1'
      expect(result.address).toMatch(/^tb1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39,59}$/);
    });

    it('generates valid mainnet address format', () => {
      const mainnetInput = { ...sampleInput, network: 'mainnet' as const };
      const result = buildPlan(mainnetInput);
      // Mainnet native SegWit addresses start with 'bc1'
      expect(result.address).toMatch(/^bc1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39,59}$/);
    });

    it('generates valid regtest address format', () => {
      const regtestInput = { ...sampleInput, network: 'regtest' as const };
      const result = buildPlan(regtestInput);
      // Regtest uses 'bcrt1' prefix
      expect(result.address).toMatch(/^bcrt1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{39,59}$/);
    });

    it('produces different script hashes for different locktimes', () => {
      const input1 = { ...sampleInput, locktime_blocks: 144 };
      const input2 = { ...sampleInput, locktime_blocks: 1000 };
      
      const result1 = buildPlan(input1);
      const result2 = buildPlan(input2);
      
      expect(result1.script_hex).not.toBe(result2.script_hex);
      expect(result1.address).not.toBe(result2.address);
    });

    it('generates different addresses for different owner keys', () => {
      const input1 = sampleInput;
      const input2 = { 
        ...sampleInput, 
        owner_pubkey: '02a9634f19b165239105436a5c17e3371901c5651581452a329978747474747474'
      };
      
      const result1 = buildPlan(input1);
      const result2 = buildPlan(input2);
      
      expect(result1.address).not.toBe(result2.address);
    });

    it('generates different addresses for different beneficiary keys', () => {
      const input1 = sampleInput;
      const input2 = { 
        ...sampleInput, 
        beneficiary_pubkey: '02b634f19b165239105436a5c17e3371901c5651581452a3299787474747474747'
      };
      
      const result1 = buildPlan(input1);
      const result2 = buildPlan(input2);
      
      expect(result1.address).not.toBe(result2.address);
    });
  });

  describe('buildPlan - Output Structure', () => {
    it('returns complete PlanOutput structure', () => {
      const result = buildPlan(sampleInput);
      
      expect(result).toHaveProperty('descriptor');
      expect(result).toHaveProperty('script_asm');
      expect(result).toHaveProperty('script_hex');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('witness_script');
      expect(result).toHaveProperty('network');
      expect(result).toHaveProperty('human_explanation');
    });

    it('script_hex matches witness_script', () => {
      const result = buildPlan(sampleInput);
      expect(result.script_hex).toBe(result.witness_script);
    });

    it('descriptor contains script hex', () => {
      const result = buildPlan(sampleInput);
      expect(result.descriptor).toContain(result.script_hex);
      expect(result.descriptor).toMatch(/^wsh\(raw\([a-f0-9]+\)\)$/);
    });

    it('script_asm contains expected opcodes', () => {
      const result = buildPlan(sampleInput);
      expect(result.script_asm).toContain('OP_IF');
      expect(result.script_asm).toContain('OP_CHECKSIG');
      expect(result.script_asm).toContain('OP_ELSE');
      // bitcoinjs-lib might use OP_NOP3 for OP_CHECKSEQUENCEVERIFY
      const hasCSV = result.script_asm.includes('OP_CHECKSEQUENCEVERIFY') || 
                    result.script_asm.includes('OP_NOP3');
      expect(hasCSV).toBe(true);
      expect(result.script_asm).toContain('OP_DROP');
      expect(result.script_asm).toContain('OP_ENDIF');
    });

    it('script_asm contains owner and beneficiary public keys', () => {
      const result = buildPlan(sampleInput);
      expect(result.script_asm).toContain(sampleInput.owner_pubkey.substring(0, 20));
      expect(result.script_asm).toContain(sampleInput.beneficiary_pubkey.substring(0, 20));
    });

    it('script_hex is valid hexadecimal', () => {
      const result = buildPlan(sampleInput);
      expect(result.script_hex).toMatch(/^[a-f0-9]+$/);
      expect(result.script_hex.length % 2).toBe(0); // Even length = complete bytes
    });

    it('network field matches input network', () => {
      const testnetResult = buildPlan({ ...sampleInput, network: 'testnet' });
      expect(testnetResult.network).toBe('testnet');

      const mainnetResult = buildPlan({ ...sampleInput, network: 'mainnet' });
      expect(mainnetResult.network).toBe('mainnet');

      const regtestResult = buildPlan({ ...sampleInput, network: 'regtest' });
      expect(regtestResult.network).toBe('regtest');
    });
  });

  describe('buildPlan - Human Explanation', () => {
    it('contains human readable explanation array', () => {
      const result = buildPlan(sampleInput);
      expect(Array.isArray(result.human_explanation)).toBe(true);
      expect(result.human_explanation.length).toBeGreaterThanOrEqual(3);
    });

    it('explanation contains vault address', () => {
      const result = buildPlan(sampleInput);
      expect(result.human_explanation[0]).toContain(result.address);
    });

    it('explanation mentions owner capabilities', () => {
      const result = buildPlan(sampleInput);
      const ownerLine = result.human_explanation.find(line => line.includes('Owner'));
      expect(ownerLine).toBeDefined();
      expect(ownerLine).toContain('can spend');
    });

    it('explanation mentions beneficiary conditions', () => {
      const result = buildPlan(sampleInput);
      const beneficiaryLine = result.human_explanation.find(line => line.includes('Beneficiary'));
      expect(beneficiaryLine).toBeDefined();
      expect(beneficiaryLine).toContain('ONLY');
      expect(beneficiaryLine).toContain(String(sampleInput.locktime_blocks));
    });

    it('explanation includes locktime approximation in days', () => {
      const result = buildPlan(sampleInput);
      const expectedDays = Math.round(sampleInput.locktime_blocks / 144);
      const hasDaysInfo = result.human_explanation.some(line => 
        line.includes(`${expectedDays} days`) || line.includes('~')
      );
      expect(hasDaysInfo).toBe(true);
    });

    it('explanation mentions timer reset behavior', () => {
      const result = buildPlan(sampleInput);
      const resetLine = result.human_explanation.find(line => line.includes('resets'));
      expect(resetLine).toBeDefined();
      expect(resetLine).toContain('Owner');
    });
  });

  describe('buildPlan - Validation Errors', () => {
    it('throws error on invalid public key format', () => {
      const badInput = { ...sampleInput, owner_pubkey: 'invalid' };
      expect(() => buildPlan(badInput)).toThrow('Invalid Owner Public Key');
    });

    it('throws error on public key with wrong prefix', () => {
      // Valid hex but wrong prefix (04 is uncompressed, not 02/03)
      const badKey = '04e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
      const badInput = { ...sampleInput, owner_pubkey: badKey };
      expect(() => buildPlan(badInput)).toThrow('Invalid Owner Public Key');
    });

    it('throws error on public key with invalid hex characters', () => {
      const badKey = '02e9634f19b165239105436a5c17e3371901c5651581452a3299787474747474ZZ'; // ZZ is invalid hex
      const badInput = { ...sampleInput, owner_pubkey: badKey };
      expect(() => buildPlan(badInput)).toThrow('Invalid Owner Public Key');
    });

    it('throws error on public key with wrong length', () => {
      // Too short (64 chars instead of 66)
      const shortKey = '02e9634f19b165239105436a5c17e3371901c5651581452a3299787474747474';
      const badInput = { ...sampleInput, owner_pubkey: shortKey };
      expect(() => buildPlan(badInput)).toThrow('Invalid Owner Public Key');
    });

    it('throws error when owner and beneficiary keys are identical', () => {
      const badInput = { 
        ...sampleInput, 
        beneficiary_pubkey: sampleInput.owner_pubkey 
      };
      expect(() => buildPlan(badInput)).toThrow('Owner and Beneficiary public keys must be different');
    });

    it('throws error on locktime of 0 blocks', () => {
      const badInput = { ...sampleInput, locktime_blocks: 0 };
      expect(() => buildPlan(badInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error on negative locktime', () => {
      const badInput = { ...sampleInput, locktime_blocks: -1 };
      expect(() => buildPlan(badInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error on locktime exceeding maximum (1 year)', () => {
      const badInput = { ...sampleInput, locktime_blocks: 52561 };
      expect(() => buildPlan(badInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error on non-integer locktime', () => {
      const badInput = { ...sampleInput, locktime_blocks: 1.5 };
      expect(() => buildPlan(badInput)).toThrow('Delay must be between 1 and 52,560 blocks');
    });

    it('throws error on unsupported runtime network payload', () => {
      const badInput = {
        ...sampleInput,
        network: 'signet' as unknown as PlanInput['network'],
      };
      expect(() => buildPlan(badInput)).toThrow('Invalid network');
    });

    it('throws error on unsupported inheritance type runtime payload', () => {
      const badInput = {
        ...sampleInput,
        inheritance_type: 'legacy_recovery' as unknown as PlanInput['inheritance_type'],
      };
      expect(() => buildPlan(badInput)).toThrow('Invalid inheritance type');
    });

    it('throws error on locktime at exact maximum boundary', () => {
      // 52560 should be the max (inclusive)
      const maxInput = { ...sampleInput, locktime_blocks: 52560 };
      expect(() => buildPlan(maxInput)).not.toThrow();
    });

    it('accepts minimum valid locktime of 1 block', () => {
      const minInput = { ...sampleInput, locktime_blocks: 1 };
      expect(() => buildPlan(minInput)).not.toThrow();
    });
  });

  describe('buildPlan - Edge Cases', () => {
    it('handles minimum locktime (1 block)', () => {
      const input = { ...sampleInput, locktime_blocks: 1 };
      const result = buildPlan(input);
      expect(result.address).toBeDefined();
      expect(result.human_explanation[2]).toContain('1 blocks');
      expect(result.human_explanation[2]).not.toContain('0 days');
    });

    it('handles maximum locktime (52560 blocks ~ 1 year)', () => {
      const input = { ...sampleInput, locktime_blocks: 52560 };
      const result = buildPlan(input);
      expect(result.address).toBeDefined();
      expect(result.human_explanation[2]).toContain('52560 blocks');
    });

    it('handles round-number locktimes', () => {
      // 144 blocks = ~1 day
      const input1 = { ...sampleInput, locktime_blocks: 144 };
      const result1 = buildPlan(input1);
      expect(result1.address).toBeDefined();

      // 4320 blocks = ~1 month
      const input2 = { ...sampleInput, locktime_blocks: 4320 };
      const result2 = buildPlan(input2);
      expect(result2.address).toBeDefined();
    });

    it('handles different public key prefixes (02 vs 03)', () => {
      const key02 = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
      const key03 = '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
      
      const input = {
        ...sampleInput,
        owner_pubkey: key02,
        beneficiary_pubkey: key03
      };
      
      const result = buildPlan(input);
      expect(result.address).toBeDefined();
      expect(result.script_asm).toContain(key02.substring(0, 20));
      expect(result.script_asm).toContain(key03.substring(0, 20));
    });
  });
});
