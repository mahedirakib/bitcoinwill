import { describe, expect, it } from 'vitest';
import { buildCheckInPlan } from './checkin';

describe('checkin helpers', () => {
  it('returns unknown status when confirmations are unavailable', () => {
    const plan = buildCheckInPlan(1_000);
    expect(plan.status).toBe('unknown');
    expect(plan.recommendedCheckInEveryBlocks).toBe(500);
    expect(plan.oldestUtxoConfirmations).toBeUndefined();
  });

  it('returns on_track when confirmations are below recommended cadence', () => {
    const plan = buildCheckInPlan(1_000, [{ valueSats: 10_000, confirmed: true, confirmations: 300 }], 0.5);
    expect(plan.status).toBe('on_track');
    expect(plan.blocksUntilRecommendedCheckIn).toBe(200);
    expect(plan.blocksUntilBeneficiaryEligible).toBe(700);
  });

  it('returns due_now once recommended check-in window has passed', () => {
    const plan = buildCheckInPlan(1_000, [{ valueSats: 10_000, confirmed: true, confirmations: 550 }], 0.5);
    expect(plan.status).toBe('due_now');
    expect(plan.blocksUntilRecommendedCheckIn).toBe(-50);
    expect(plan.blocksUntilBeneficiaryEligible).toBe(450);
  });

  it('returns beneficiary_path_open when locktime has fully elapsed', () => {
    const plan = buildCheckInPlan(1_000, [{ valueSats: 10_000, confirmed: true, confirmations: 1_000 }], 0.5);
    expect(plan.status).toBe('beneficiary_path_open');
    expect(plan.blocksUntilBeneficiaryEligible).toBe(0);
    expect(plan.beneficiaryEligibilityApprox).toBe('already eligible');
  });

  it('classifies every UTXO independently and uses the oldest for urgency', () => {
    const plan = buildCheckInPlan(1_000, [
      { valueSats: 20_000, confirmed: true, confirmations: 1_200 },
      { valueSats: 30_000, confirmed: true, confirmations: 400 },
      { valueSats: 5_000, confirmed: false },
    ], 0.5);

    expect(plan.status).toBe('beneficiary_path_open');
    expect(plan.oldestUtxoConfirmations).toBe(1_200);
    expect(plan.matureUtxoCount).toBe(1);
    expect(plan.matureBalanceSats).toBe(20_000);
    expect(plan.immatureUtxoCount).toBe(1);
    expect(plan.immatureBalanceSats).toBe(30_000);
    expect(plan.unconfirmedUtxoCount).toBe(1);
    expect(plan.unconfirmedBalanceSats).toBe(5_000);
  });

  it('does not classify confirmed UTXOs when the tip height is unavailable', () => {
    const plan = buildCheckInPlan(1_000, [
      { valueSats: 8_000, confirmed: true },
    ]);

    expect(plan.status).toBe('unknown');
    expect(plan.confirmedUtxoCount).toBe(1);
    expect(plan.unknownAgeUtxoCount).toBe(1);
    expect(plan.unknownAgeBalanceSats).toBe(8_000);
    expect(plan.unconfirmedUtxoCount).toBe(0);
  });

  it('clamps cadence ratio to safe bounds', () => {
    const low = buildCheckInPlan(1_000, undefined, 0.01);
    const high = buildCheckInPlan(1_000, undefined, 2);
    expect(low.cadenceRatio).toBe(0.2);
    expect(high.cadenceRatio).toBe(0.9);
    expect(low.recommendedCheckInEveryBlocks).toBe(200);
    expect(high.recommendedCheckInEveryBlocks).toBe(900);
  });

  it('rejects locktime exceeding the protocol maximum', () => {
    expect(() => buildCheckInPlan(52_561)).toThrow('between 1 and 52560');
  });

  it('rejects non-integer locktime', () => {
    expect(() => buildCheckInPlan(1.5)).toThrow('between 1 and 52560');
  });

  it('accepts the maximum allowed locktime', () => {
    expect(() => buildCheckInPlan(52_560)).not.toThrow();
  });
});
