import { describe, it, expect } from 'vitest';
import { buildPlan } from './planEngine';
import { buildTaprootPlan } from './taproot';
import { buildSpendTemplate } from './spendTemplate';
import type { PlanInput } from './types';
import type { VaultUtxo } from './explorer/types';

const owner = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
const beneficiary = '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';

const basePlan: PlanInput = {
  network: 'testnet',
  inheritance_type: 'timelock_recovery',
  owner_pubkey: owner,
  beneficiary_pubkey: beneficiary,
  locktime_blocks: 144,
};

const utxo = (overrides: Partial<VaultUtxo> = {}): VaultUtxo => ({
  txid: 'a'.repeat(64),
  vout: 0,
  valueSats: 100_000,
  confirmed: true,
  confirmations: 200,
  ...overrides,
});

describe('buildSpendTemplate', () => {
  it('builds an unsigned P2WSH owner PSBT', () => {
    const result = buildPlan(basePlan);
    const template = buildSpendTemplate({
      network: 'testnet',
      plan: basePlan,
      result,
      utxos: [utxo()],
      destinationAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      feeRateSatsPerVbyte: 5,
      path: 'owner',
    });

    expect(template.psbtBase64.length).toBeGreaterThan(40);
    expect(template.psbtHex).toMatch(/^[0-9a-f]+$/);
    expect(template.inputCount).toBe(1);
    expect(template.outputSats).toBe(template.totalInputSats - template.feeSats);
    expect(template.feeSats).toBeGreaterThan(0);
    expect(template.warnings.some((w) => w.includes('unsigned'))).toBe(true);
  });

  it('builds a beneficiary PSBT with CSV sequence requirements', () => {
    const result = buildPlan(basePlan);
    const template = buildSpendTemplate({
      network: 'testnet',
      plan: basePlan,
      result,
      utxos: [utxo({ confirmations: 144 })],
      destinationAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      feeRateSatsPerVbyte: 2,
      path: 'beneficiary',
    });

    expect(template.path).toBe('beneficiary');
    expect(template.warnings.some((w) => w.includes('nSequence=144'))).toBe(true);
  });

  it('rejects beneficiary path when CSV confirmations are insufficient', () => {
    const result = buildPlan(basePlan);
    expect(() =>
      buildSpendTemplate({
        network: 'testnet',
        plan: basePlan,
        result,
        utxos: [utxo({ confirmations: 10 })],
        destinationAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        feeRateSatsPerVbyte: 2,
        path: 'beneficiary',
      }),
    ).toThrow(/confirmation/i);
  });

  it('builds a check-in PSBT paying the vault address', () => {
    const result = buildPlan(basePlan);
    const template = buildSpendTemplate({
      network: 'testnet',
      plan: basePlan,
      result,
      utxos: [utxo()],
      feeRateSatsPerVbyte: 3,
      path: 'checkin',
    });

    expect(template.destinationAddress).toBe(result.address.toLowerCase());
    expect(template.path).toBe('checkin');
  });

  it('builds a P2TR script-path template', () => {
    const plan: PlanInput = {
      ...basePlan,
      address_type: 'p2tr',
      // Distinct x-coordinates required for Taproot x-only keys.
      beneficiary_pubkey: '02a9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
    };
    const result = buildTaprootPlan(plan);
    const template = buildSpendTemplate({
      network: 'testnet',
      plan,
      result,
      utxos: [utxo()],
      destinationAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      feeRateSatsPerVbyte: 4,
      path: 'owner',
    });

    expect(template.psbtBase64.length).toBeGreaterThan(40);
  });

  it('rejects invalid fee rates and dust outputs', () => {
    const result = buildPlan(basePlan);
    expect(() =>
      buildSpendTemplate({
        network: 'testnet',
        plan: basePlan,
        result,
        utxos: [utxo()],
        destinationAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        feeRateSatsPerVbyte: 0,
        path: 'owner',
      }),
    ).toThrow(/Fee rate/);

    expect(() =>
      buildSpendTemplate({
        network: 'testnet',
        plan: basePlan,
        result,
        utxos: [utxo({ valueSats: 600 })],
        destinationAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        feeRateSatsPerVbyte: 1,
        path: 'owner',
      }),
    ).toThrow(/dust|below|10%/i);
  });

  it('rejects destination equal to vault for non-checkin paths', () => {
    const result = buildPlan(basePlan);
    expect(() =>
      buildSpendTemplate({
        network: 'testnet',
        plan: basePlan,
        result,
        utxos: [utxo()],
        destinationAddress: result.address,
        feeRateSatsPerVbyte: 2,
        path: 'owner',
      }),
    ).toThrow(/check-in/);
  });
});
