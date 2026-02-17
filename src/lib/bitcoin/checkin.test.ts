import { describe, expect, it } from 'vitest';
import { buildCheckInPlan } from './checkin';

describe('checkin helpers', () => {
  it('returns unknown status when confirmations are unavailable', () => {
    const plan = buildCheckInPlan(1_000);
    expect(plan.status).toBe('unknown');
    expect(plan.recommendedCheckInEveryBlocks).toBe(500);
    expect(plan.confirmationsSinceLastFunding).toBeUndefined();
  });

  it('returns on_track when confirmations are below recommended cadence', () => {
    const plan = buildCheckInPlan(1_000, 300, 0.5);
    expect(plan.status).toBe('on_track');
    expect(plan.blocksUntilRecommendedCheckIn).toBe(200);
    expect(plan.blocksUntilBeneficiaryEligible).toBe(700);
  });

  it('returns due_now once recommended check-in window has passed', () => {
    const plan = buildCheckInPlan(1_000, 550, 0.5);
    expect(plan.status).toBe('due_now');
    expect(plan.blocksUntilRecommendedCheckIn).toBe(-50);
    expect(plan.blocksUntilBeneficiaryEligible).toBe(450);
  });

  it('returns beneficiary_path_open when locktime has fully elapsed', () => {
    const plan = buildCheckInPlan(1_000, 1_000, 0.5);
    expect(plan.status).toBe('beneficiary_path_open');
    expect(plan.blocksUntilBeneficiaryEligible).toBe(0);
    expect(plan.beneficiaryEligibilityApprox).toBe('already eligible');
  });

  it('clamps cadence ratio to safe bounds', () => {
    const low = buildCheckInPlan(1_000, undefined, 0.01);
    const high = buildCheckInPlan(1_000, undefined, 2);
    expect(low.cadenceRatio).toBe(0.2);
    expect(high.cadenceRatio).toBe(0.9);
    expect(low.recommendedCheckInEveryBlocks).toBe(200);
    expect(high.recommendedCheckInEveryBlocks).toBe(900);
  });
});
