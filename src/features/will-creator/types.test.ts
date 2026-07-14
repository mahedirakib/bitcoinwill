import { describe, expect, it } from 'vitest';
import { buildPlan } from '@/lib/bitcoin/planEngine';
import type { PlanInput } from '@/lib/bitcoin/types';
import { createInitialState, wizardReducer } from './types';

describe('wizardReducer', () => {
  it('stores the exact completed plan input used to build the result', () => {
    const generatedBeneficiaryPubkey =
      '02b634f19b165239105436a5c17e3371901c5651581452a3299787474747474747';
    const completedInput: PlanInput = {
      ...createInitialState('testnet').input,
      owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      beneficiary_pubkey: generatedBeneficiaryPubkey,
      recovery_method: 'social',
      sss_config: { threshold: 2, total: 3 },
    };
    const result = buildPlan(completedInput);

    const state = wizardReducer(createInitialState('testnet'), {
      type: 'SET_COMPLETED_PLAN',
      payload: { input: completedInput, result },
    });

    expect(state.step).toBe('RESULT');
    expect(state.input.beneficiary_pubkey).toBe(generatedBeneficiaryPubkey);
    expect(state.result?.address).toBe(result.address);
    expect(state.errors).toEqual({});
  });
});
