import {
  INHERITANCE_TYPE,
  isBitcoinNetwork,
  type BitcoinNetwork,
  type PlanInput,
} from '@/lib/bitcoin/types';
import { normalizePubkeyHex } from './safety';

export type WizardDraftStep = 'TYPE' | 'KEYS' | 'TIMELOCK' | 'REVIEW';

const DEFAULT_LOCKTIME_BLOCKS = 144;
const MIN_LOCKTIME_BLOCKS = 1;
const MAX_LOCKTIME_BLOCKS = 52_560;
const WIZARD_DRAFT_STEPS: readonly WizardDraftStep[] = ['TYPE', 'KEYS', 'TIMELOCK', 'REVIEW'];

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isWizardDraftStep = (value: unknown): value is WizardDraftStep =>
  typeof value === 'string' && WIZARD_DRAFT_STEPS.includes(value as WizardDraftStep);

const sanitizePubkey = (value: unknown): string =>
  typeof value === 'string' ? normalizePubkeyHex(value) : '';

const sanitizeLocktime = (value: unknown): number => {
  if (!Number.isSafeInteger(value)) return DEFAULT_LOCKTIME_BLOCKS;
  const locktime = value as number;
  if (locktime < MIN_LOCKTIME_BLOCKS || locktime > MAX_LOCKTIME_BLOCKS) {
    return DEFAULT_LOCKTIME_BLOCKS;
  }
  return locktime;
};

const sanitizePlanInput = (value: Record<string, unknown>, fallbackNetwork: BitcoinNetwork): PlanInput => ({
  network: isBitcoinNetwork(value.network) ? value.network : fallbackNetwork,
  inheritance_type: INHERITANCE_TYPE,
  owner_pubkey: sanitizePubkey(value.owner_pubkey),
  beneficiary_pubkey: sanitizePubkey(value.beneficiary_pubkey),
  locktime_blocks: sanitizeLocktime(value.locktime_blocks),
});

export interface RestoredWizardDraft {
  step: WizardDraftStep;
  input: PlanInput;
}

export const parseWizardDraft = (
  serializedDraft: string | null,
  fallbackNetwork: BitcoinNetwork,
): RestoredWizardDraft | null => {
  if (!serializedDraft) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(serializedDraft);
  } catch {
    return null;
  }

  if (!isObjectRecord(parsed)) return null;
  if (!isWizardDraftStep(parsed.step)) return null;
  if (!isObjectRecord(parsed.input)) return null;

  return {
    step: parsed.step,
    input: sanitizePlanInput(parsed.input, fallbackNetwork),
  };
};
