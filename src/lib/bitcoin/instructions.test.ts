import { describe, it, expect } from 'vitest';
import {
  buildInstructions,
  generateInstructionTxt,
  InstructionModel,
  validateAndNormalizeRecoveryKit,
} from './instructions';
import { PlanInput, PlanOutput } from './types';
import { buildPlan } from './planEngine';

describe('Instructions Module', () => {
  const mockPlanInput: PlanInput = {
    network: 'testnet',
    inheritance_type: 'timelock_recovery',
    owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
    beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
    locktime_blocks: 144,
    plan_label: 'Test Plan',
  };

  const mockPlanOutput: PlanOutput = {
    descriptor: 'wsh(raw(6376a914...88ac))',
    script_asm: 'OP_IF 02e963... OP_CHECKSIG OP_ELSE 144 ...',
    script_hex: '6376a914...88ac',
    address: 'tb1qxyz123',
    witness_script: '6376a914...88ac',
    network: 'testnet',
    human_explanation: [
      'Vault Address: tb1qxyz123',
      'Owner can spend at any time',
      'Beneficiary can spend after 144 blocks',
    ],
  };

  const canonicalPlanInput: PlanInput = {
    network: 'testnet',
    inheritance_type: 'timelock_recovery',
    owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
    beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
    locktime_blocks: 144,
  };

  describe('buildInstructions', () => {
    it('creates InstructionModel from plan and result', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      
      expect(result).toHaveProperty('network');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('ownerPubkey');
      expect(result).toHaveProperty('beneficiaryPubkey');
      expect(result).toHaveProperty('locktimeBlocks');
      expect(result).toHaveProperty('locktimeApprox');
      expect(result).toHaveProperty('witnessScriptHex');
      expect(result).toHaveProperty('witnessScriptAsm');
      expect(result).toHaveProperty('descriptor');
      expect(result).toHaveProperty('createdAt');
    });

    it('converts network to uppercase', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      expect(result.network).toBe('TESTNET');
    });

    it('handles mainnet network', () => {
      const mainnetInput = { ...mockPlanInput, network: 'mainnet' as const };
      const result = buildInstructions(mainnetInput, { ...mockPlanOutput, network: 'mainnet' });
      expect(result.network).toBe('MAINNET');
    });

    it('handles regtest network', () => {
      const regtestInput = { ...mockPlanInput, network: 'regtest' as const };
      const result = buildInstructions(regtestInput, { ...mockPlanOutput, network: 'regtest' });
      expect(result.network).toBe('REGTEST');
    });

    it('preserves address from plan output', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      expect(result.address).toBe(mockPlanOutput.address);
    });

    it('preserves owner public key', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      expect(result.ownerPubkey).toBe(mockPlanInput.owner_pubkey);
    });

    it('preserves beneficiary public key', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      expect(result.beneficiaryPubkey).toBe(mockPlanInput.beneficiary_pubkey);
    });

    it('preserves locktime blocks', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      expect(result.locktimeBlocks).toBe(mockPlanInput.locktime_blocks);
    });

    it('converts locktime blocks to human-readable approximation', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      expect(result.locktimeApprox).toBeDefined();
      expect(typeof result.locktimeApprox).toBe('string');
    });

    it('preserves witness script hex', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      expect(result.witnessScriptHex).toBe(mockPlanOutput.witness_script);
    });

    it('preserves witness script asm', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      expect(result.witnessScriptAsm).toBe(mockPlanOutput.script_asm);
    });

    it('preserves descriptor', () => {
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      expect(result.descriptor).toBe(mockPlanOutput.descriptor);
    });

    it('uses provided createdAt timestamp', () => {
      const customTimestamp = '2026-02-08T10:30:00.000Z';
      const result = buildInstructions(mockPlanInput, mockPlanOutput, customTimestamp);
      expect(result.createdAt).toBe(customTimestamp);
    });

    it('generates current timestamp when createdAt not provided', () => {
      const before = new Date();
      const result = buildInstructions(mockPlanInput, mockPlanOutput);
      const after = new Date();
      
      expect(result.createdAt).toBeDefined();
      const createdDate = new Date(result.createdAt!);
      expect(createdDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('calculates correct time approximation for 1 day (144 blocks)', () => {
      const input = { ...mockPlanInput, locktime_blocks: 144 };
      const result = buildInstructions(input, mockPlanOutput);
      expect(result.locktimeApprox).toContain('1');
    });

    it('calculates correct time approximation for 1 month (~4320 blocks)', () => {
      const input = { ...mockPlanInput, locktime_blocks: 4320 };
      const result = buildInstructions(input, mockPlanOutput);
      expect(result.locktimeApprox).toContain('1');
    });

    it('calculates correct time approximation for 1 year (52560 blocks)', () => {
      const input = { ...mockPlanInput, locktime_blocks: 52560 };
      const result = buildInstructions(input, mockPlanOutput);
      expect(result.locktimeApprox).toBe('1.0 years');
    });
  });

  describe('generateInstructionTxt', () => {
    const mockInstructionModel: InstructionModel = {
      network: 'TESTNET',
      address: 'tb1qxyz123',
      ownerPubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      beneficiaryPubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      locktimeBlocks: 144,
      locktimeApprox: '~1 days',
      witnessScriptHex: '6376a914...88ac',
      witnessScriptAsm: 'OP_IF ... OP_CHECKSIG ...',
      descriptor: 'wsh(raw(6376a914...88ac))',
      createdAt: '2026-02-08T10:30:00.000Z',
    };

    it('generates a non-empty string', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('includes beneficiary instructions header', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('BENEFICIARY INSTRUCTIONS');
      expect(result).toContain('BITCOIN WILL');
    });

    it('includes generation timestamp', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('Generated on:');
      expect(result).toContain(mockInstructionModel.createdAt);
    });

    it('includes vault address', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('Vault Address:');
      expect(result).toContain(mockInstructionModel.address);
    });

    it('includes network information', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('Network:');
      expect(result).toContain(mockInstructionModel.network);
    });

    it('includes locktime information', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('Delay:');
      expect(result).toContain(String(mockInstructionModel.locktimeBlocks));
      expect(result).toContain(mockInstructionModel.locktimeApprox);
    });

    it('includes beneficiary public key', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('Beneficiary Pubkey:');
      expect(result).toContain(mockInstructionModel.beneficiaryPubkey);
    });

    it('includes witness script', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('Witness Script');
      expect(result).toContain(mockInstructionModel.witnessScriptHex);
    });

    it('includes descriptor', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('Descriptor:');
      expect(result).toContain(mockInstructionModel.descriptor);
    });

    it('includes recovery steps section', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('RECOVERY STEPS');
      expect(result).toContain('Confirm the vault address');
      expect(result).toContain('Construct a "Sweep" transaction');
    });

    it('includes warnings section', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('WARNINGS');
      expect(result).toContain('Mistakes are irreversible');
      expect(result).toContain('Never share your private keys');
    });

    it('explains what is needed to claim', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('WHAT YOU NEED');
      expect(result).toContain('Your Private Key');
      expect(result).toContain('Witness Script');
      expect(result).toContain('Advanced Wallet');
    });

    it('explains when funds can be claimed', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('WHEN YOU CAN CLAIM');
      expect(result).toContain('unmoved at the vault address');
    });

    it('provides practical guidance', () => {
      const result = generateInstructionTxt(mockInstructionModel);
      expect(result).toContain('Sparrow Wallet');
      expect(result).toContain('blockchain explorer');
    });
  });

  describe('validateAndNormalizeRecoveryKit', () => {
    it('accepts a valid recovery kit and returns canonical result', () => {
      const result = buildPlan(canonicalPlanInput);
      const kit = {
        version: '0.1.0',
        created_at: '2026-02-08T10:30:00.000Z',
        plan: canonicalPlanInput,
        result,
      };

      const normalized = validateAndNormalizeRecoveryKit(kit);

      expect(normalized.plan).toEqual(canonicalPlanInput);
      expect(normalized.result.address).toBe(result.address);
      expect(normalized.result.descriptor).toBe(result.descriptor);
    });

    it('rejects kit missing required fields', () => {
      expect(() => validateAndNormalizeRecoveryKit({})).toThrow('missing plan or result');
    });

    it('rejects tampered result payload', () => {
      const result = buildPlan(canonicalPlanInput);
      const tampered = {
        plan: canonicalPlanInput,
        result: {
          ...result,
          address: 'tb1qnottherealvaultaddressxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        },
      };

      expect(() => validateAndNormalizeRecoveryKit(tampered)).toThrow('failed integrity check');
    });
  });
});
