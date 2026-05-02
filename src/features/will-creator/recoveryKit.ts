import type { RecoveryKitData } from '@/lib/bitcoin/instructions';
import type { PlanInput, PlanOutput } from '@/lib/bitcoin/types';

export const stripRecoveryKitSecrets = (result: PlanOutput): PlanOutput => {
  const { social_recovery_kit: _socialRecoveryKit, ...safeResult } = result;
  return safeResult;
};

export const createRecoveryKitExport = (
  plan: PlanInput,
  result: PlanOutput,
  createdAt = new Date().toISOString(),
): RecoveryKitData => ({
  version: '0.1.0',
  created_at: createdAt,
  plan,
  result: stripRecoveryKitSecrets(result),
});
