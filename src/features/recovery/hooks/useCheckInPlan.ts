import { useMemo } from 'react';
import type { AddressSummary } from '@/lib/bitcoin/explorer';
import { buildCheckInPlan, type CheckInPlan } from '@/lib/bitcoin/checkin';

interface UseCheckInPlanResult {
  checkInPlan: CheckInPlan | null;
}

export const useCheckInPlan = (
  locktimeBlocks: number,
  vaultStatus: AddressSummary | null,
  checkInCadence: number
): UseCheckInPlanResult => {
  const checkInPlan: CheckInPlan | null = useMemo(() => {
    if (locktimeBlocks <= 0) return null;
    return buildCheckInPlan(
      locktimeBlocks,
      vaultStatus?.lastConfirmedFundingTx?.confirmations,
      checkInCadence,
    );
  }, [locktimeBlocks, vaultStatus?.lastConfirmedFundingTx?.confirmations, checkInCadence]);

  return { checkInPlan };
};
