import { calculateTime } from './utils';
import { MAX_LOCKTIME_BLOCKS } from './types';

export type CheckInStatus = 'unknown' | 'on_track' | 'due_now' | 'beneficiary_path_open';

export interface CheckInPlan {
  locktimeBlocks: number;
  cadenceRatio: number;
  recommendedCheckInEveryBlocks: number;
  recommendedCheckInEveryApprox: string;
  oldestUtxoConfirmations?: number;
  blocksUntilRecommendedCheckIn?: number;
  blocksUntilBeneficiaryEligible?: number;
  beneficiaryEligibilityApprox?: string;
  confirmedUtxoCount: number;
  unconfirmedUtxoCount: number;
  unknownAgeUtxoCount: number;
  matureUtxoCount: number;
  immatureUtxoCount: number;
  matureBalanceSats: number;
  immatureBalanceSats: number;
  unconfirmedBalanceSats: number;
  unknownAgeBalanceSats: number;
  status: CheckInStatus;
}

export interface CheckInUtxo {
  valueSats: number;
  confirmed?: boolean;
  confirmations?: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeCadenceRatio = (cadenceRatio: number): number => {
  if (!Number.isFinite(cadenceRatio)) return 0.5;
  return clamp(cadenceRatio, 0.2, 0.9);
};

export const buildCheckInPlan = (
  locktimeBlocks: number,
  utxos: readonly CheckInUtxo[] = [],
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
  const confirmedUtxos = utxos.filter(
    (utxo) => utxo.confirmed === true || typeof utxo.confirmations === 'number',
  );
  const knownAgeUtxos = confirmedUtxos.filter(
    (utxo) => typeof utxo.confirmations === 'number' && Number.isFinite(utxo.confirmations),
  );
  const unconfirmedUtxos = utxos.filter(
    (utxo) => utxo.confirmed === false,
  );
  const unknownAgeUtxos = confirmedUtxos.filter(
    (utxo) => typeof utxo.confirmations !== 'number' || !Number.isFinite(utxo.confirmations),
  );
  const matureUtxos = knownAgeUtxos.filter((utxo) => Math.max(0, Math.floor(utxo.confirmations!)) >= locktimeBlocks);
  const immatureUtxos = knownAgeUtxos.filter((utxo) => Math.max(0, Math.floor(utxo.confirmations!)) < locktimeBlocks);
  const baseSummary = {
    confirmedUtxoCount: confirmedUtxos.length,
    unconfirmedUtxoCount: unconfirmedUtxos.length,
    unknownAgeUtxoCount: unknownAgeUtxos.length,
    matureUtxoCount: matureUtxos.length,
    immatureUtxoCount: immatureUtxos.length,
    matureBalanceSats: matureUtxos.reduce((sum, utxo) => sum + Math.max(0, Math.floor(utxo.valueSats)), 0),
    immatureBalanceSats: immatureUtxos.reduce((sum, utxo) => sum + Math.max(0, Math.floor(utxo.valueSats)), 0),
    unconfirmedBalanceSats: unconfirmedUtxos.reduce((sum, utxo) => sum + Math.max(0, Math.floor(utxo.valueSats)), 0),
    unknownAgeBalanceSats: unknownAgeUtxos.reduce((sum, utxo) => sum + Math.max(0, Math.floor(utxo.valueSats)), 0),
  };

  if (knownAgeUtxos.length === 0) {
    return {
      locktimeBlocks,
      cadenceRatio: normalizedCadence,
      recommendedCheckInEveryBlocks,
      recommendedCheckInEveryApprox: calculateTime(recommendedCheckInEveryBlocks),
      ...baseSummary,
      status: 'unknown',
    };
  }

  const confirmations = Math.max(
    ...knownAgeUtxos.map((utxo) => Math.max(0, Math.floor(utxo.confirmations!))),
  );
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
    oldestUtxoConfirmations: confirmations,
    blocksUntilRecommendedCheckIn,
    blocksUntilBeneficiaryEligible,
    beneficiaryEligibilityApprox:
      blocksUntilBeneficiaryEligible > 0
        ? calculateTime(blocksUntilBeneficiaryEligible)
        : 'already eligible',
    ...baseSummary,
    status,
  };
};
