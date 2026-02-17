import { calculateTime } from './utils';

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
  const normalizedCadence = normalizeCadenceRatio(cadenceRatio);
  const recommendedCheckInEveryBlocks = Math.max(1, Math.floor(locktimeBlocks * normalizedCadence));

  if (!Number.isFinite(confirmationsSinceLastFunding)) {
    return {
      locktimeBlocks,
      cadenceRatio: normalizedCadence,
      recommendedCheckInEveryBlocks,
      recommendedCheckInEveryApprox: calculateTime(recommendedCheckInEveryBlocks),
      status: 'unknown',
    };
  }

  const confirmations = Math.max(0, Math.floor(confirmationsSinceLastFunding as number));
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
