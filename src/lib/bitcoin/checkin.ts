import { calculateTime } from './utils';
import { MAX_LOCKTIME_BLOCKS } from './types';

export type CheckInStatus = 'unknown' | 'on_track' | 'due_now' | 'beneficiary_path_open';

export interface CheckInPlan {
  locktimeBlocks: number;
  cadenceRatio: number;
  recommendedCheckInEveryBlocks: number;
  recommendedCheckInEveryApprox: string;
  confirmationsSinceLastFunding?: number;
  blocksUntilRecommendedCheckIn?: number;
  blocksUntilBeneficiaryEligible?: number;
  beneficiaryEligibilityApprox?: string;
  status: CheckInStatus;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeCadenceRatio = (cadenceRatio: number): number => {
  if (!Number.isFinite(cadenceRatio)) return 0.5;
  return clamp(cadenceRatio, 0.2, 0.9);
};

export const buildCheckInPlan = (
  locktimeBlocks: number,
  confirmationsSinceLastFunding?: number,
  cadenceRatio = 0.5,
): CheckInPlan => {
  if (
    !Number.isFinite(locktimeBlocks) ||
    !Number.isSafeInteger(locktimeBlocks) ||
    locktimeBlocks < 1 ||
    locktimeBlocks > MAX_LOCKTIME_BLOCKS
  ) {
    throw new Error(
      `Invalid locktimeBlocks: must be a positive integer between 1 and ${MAX_LOCKTIME_BLOCKS}.`,
    );
  }

  const normalizedCadence = normalizeCadenceRatio(cadenceRatio);
  const recommendedCheckInEveryBlocks = Math.max(1, Math.floor(locktimeBlocks * normalizedCadence));

  if (typeof confirmationsSinceLastFunding !== 'number' || !Number.isFinite(confirmationsSinceLastFunding)) {
    return {
      locktimeBlocks,
      cadenceRatio: normalizedCadence,
      recommendedCheckInEveryBlocks,
      recommendedCheckInEveryApprox: calculateTime(recommendedCheckInEveryBlocks),
      status: 'unknown',
    };
  }

  const confirmations = Math.max(0, Math.floor(confirmationsSinceLastFunding));
  const blocksUntilRecommendedCheckIn = recommendedCheckInEveryBlocks - confirmations;
  const blocksUntilBeneficiaryEligible = locktimeBlocks - confirmations;

  let status: CheckInStatus = 'on_track';
  if (blocksUntilBeneficiaryEligible <= 0) {
    status = 'beneficiary_path_open';
  } else if (blocksUntilRecommendedCheckIn <= 0) {
    status = 'due_now';
  }

  return {
    locktimeBlocks,
    cadenceRatio: normalizedCadence,
    recommendedCheckInEveryBlocks,
    recommendedCheckInEveryApprox: calculateTime(recommendedCheckInEveryBlocks),
    confirmationsSinceLastFunding: confirmations,
    blocksUntilRecommendedCheckIn,
    blocksUntilBeneficiaryEligible,
    beneficiaryEligibilityApprox:
      blocksUntilBeneficiaryEligible > 0
        ? calculateTime(blocksUntilBeneficiaryEligible)
        : 'already eligible',
    status,
  };
};
