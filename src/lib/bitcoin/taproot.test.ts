import { describe, it, expect } from 'vitest';
import { buildTaprootPlan } from './taproot';
import { PlanInput } from './types';

const TEST_OWNER_KEY = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
const TEST_BENEFICIARY_KEY = '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';

describe('Taproot (P2TR) Plan Generation', () => {
  it('should generate a valid testnet P2TR address', () => {
    const input: PlanInput = {
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: TEST_OWNER_KEY,
      beneficiary_pubkey: TEST_BENEFICIARY_KEY,
      locktime_blocks: 144,
    };

    const plan = buildTaprootPlan(input);

    expect(plan.address).toBeDefined();
    expect(plan.address.startsWith('tb1p')).toBe(true);
    expect(plan.address_type).toBe('p2tr');
  });

  it('should generate a valid mainnet P2TR address', () => {
    const input: PlanInput = {
      network: 'mainnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: TEST_OWNER_KEY,
      beneficiary_pubkey: TEST_BENEFICIARY_KEY,
      locktime_blocks: 144,
    };

    const plan = buildTaprootPlan(input);

    expect(plan.address).toBeDefined();
    expect(plan.address.startsWith('bc1p')).toBe(true);
    expect(plan.address_type).toBe('p2tr');
  });

  it('should generate valid regtest P2TR address', () => {
    const input: PlanInput = {
      network: 'regtest',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: TEST_OWNER_KEY,
      beneficiary_pubkey: TEST_BENEFICIARY_KEY,
      locktime_blocks: 144,
    };

    const plan = buildTaprootPlan(input);

    expect(plan.address).toBeDefined();
    expect(plan.address.startsWith('bcrt1p')).toBe(true);
    expect(plan.address_type).toBe('p2tr');
  });

  it('should include the correct script ASM', () => {
    const input: PlanInput = {
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: TEST_OWNER_KEY,
      beneficiary_pubkey: TEST_BENEFICIARY_KEY,
      locktime_blocks: 144,
    };

    const plan = buildTaprootPlan(input);

    expect(plan.script_asm).toContain('OP_IF');
    expect(plan.script_asm).toContain('OP_CHECKSIG');
    expect(plan.script_asm).toContain('OP_ELSE');
    // OP_CHECKSEQUENCEVERIFY (0xb2) sometimes disassembles as OP_NOP3 in JS libs
    const hasCSV = plan.script_asm.includes('OP_CHECKSEQUENCEVERIFY') || plan.script_asm.includes('OP_NOP3');
    expect(hasCSV).toBe(true);
    expect(plan.script_asm).toContain('OP_ENDIF');
  });

  it('should generate a descriptor starting with tr()', () => {
    const input: PlanInput = {
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: TEST_OWNER_KEY,
      beneficiary_pubkey: TEST_BENEFICIARY_KEY,
      locktime_blocks: 144,
    };

    const plan = buildTaprootPlan(input);

    expect(plan.descriptor.startsWith('tr(')).toBe(true);
  });

  it('should provide human-readable explanations', () => {
    const input: PlanInput = {
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: TEST_OWNER_KEY,
      beneficiary_pubkey: TEST_BENEFICIARY_KEY,
      locktime_blocks: 144,
    };

    const plan = buildTaprootPlan(input);

    expect(plan.human_explanation.length).toBeGreaterThan(0);
    expect(plan.human_explanation[0]).toContain('Vault Address:');
    expect(plan.human_explanation[1]).toContain('Owner');
    expect(plan.human_explanation[2]).toContain('Beneficiary');
  });

  it('should produce different addresses than P2WSH', async () => {
    const { buildPlan } = await import('./planEngine');
    
    const input: PlanInput = {
      network: 'testnet',
      inheritance_type: 'timelock_recovery',
      owner_pubkey: TEST_OWNER_KEY,
      beneficiary_pubkey: TEST_BENEFICIARY_KEY,
      locktime_blocks: 144,
    };

    const p2trPlan = buildTaprootPlan(input);
    const p2wshPlan = buildPlan({ ...input, address_type: 'p2wsh' });

    expect(p2trPlan.address).not.toBe(p2wshPlan.address);
    expect(p2trPlan.address.startsWith('tb1p')).toBe(true);
    expect(p2wshPlan.address.startsWith('tb1q')).toBe(true);
  });
});
