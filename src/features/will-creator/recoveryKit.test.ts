import { describe, expect, it } from 'vitest';
import type { PlanInput, PlanOutput } from '@/lib/bitcoin/types';
import { createRecoveryKitExport, stripRecoveryKitSecrets } from './recoveryKit';

const plan: PlanInput = {
  network: 'testnet',
  inheritance_type: 'timelock_recovery',
  owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
  beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
  locktime_blocks: 144,
  address_type: 'p2tr',
  recovery_method: 'social',
  sss_config: { threshold: 2, total: 3 },
};

const result: PlanOutput = {
  descriptor: 'tr(abc,{def})',
  script_asm: 'OP_IF OP_CHECKSIG OP_ENDIF',
  script_hex: '51ac68',
  address: 'tb1pexamplevaultaddress000000000000000000000000000000000000',
  witness_script: '51ac68',
  network: 'testnet',
  address_type: 'p2tr',
  social_recovery_kit: {
    config: { threshold: 2, total: 3 },
    shares: [
      { index: 1, share: 'a'.repeat(80) },
      { index: 2, share: 'b'.repeat(80) },
      { index: 3, share: 'c'.repeat(80) },
    ],
    instructions: ['Distribute shares separately.'],
  },
  human_explanation: ['Vault Address: tb1pexamplevaultaddress000000000000000000000000000000000000'],
};

describe('Recovery Kit export helpers', () => {
  it('removes social recovery shares from exported plan results', () => {
    const safeResult = stripRecoveryKitSecrets(result);

    expect(safeResult.social_recovery_kit).toBeUndefined();
    expect(result.social_recovery_kit?.shares).toHaveLength(3);
  });

  it('creates a recovery kit without threshold share material', () => {
    const kit = createRecoveryKitExport(plan, result, '2026-02-08T10:30:00.000Z');

    expect(kit.created_at).toBe('2026-02-08T10:30:00.000Z');
    expect(kit.plan).toEqual(plan);
    expect(kit.result.address).toBe(result.address);
    expect(kit.result.social_recovery_kit).toBeUndefined();
    expect(JSON.stringify(kit)).not.toContain('Distribute shares separately.');
    expect(JSON.stringify(kit)).not.toContain('aaaaaaaaaa');
  });
});
