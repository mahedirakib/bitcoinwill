import {
  INHERITANCE_TYPE,
  isBitcoinNetwork,
  type BitcoinNetwork,
  type PlanInput,
} from '@/lib/bitcoin/types';
import { normalizePubkeyHex } from './safety';

import type { PlanOutput } from '@/lib/bitcoin/types';

export type WizardDraftStep = 'TYPE' | 'KEYS' | 'TIMELOCK' | 'REVIEW' | 'RESULT';

const DEFAULT_LOCKTIME_BLOCKS = 144;
const MIN_LOCKTIME_BLOCKS = 1;
const MAX_LOCKTIME_BLOCKS = 52_560;
const WIZARD_DRAFT_STEPS: readonly WizardDraftStep[] = ['TYPE', 'KEYS', 'TIMELOCK', 'REVIEW', 'RESULT'];
const DRAFT_EXPIRY_MS = 60 * 60 * 1000;

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

const isValidPlanOutput = (value: unknown): value is PlanOutput => {
  if (!isObjectRecord(value)) return false;
  if (typeof value.address !== 'string') return false;
  if (typeof value.script_hex !== 'string') return false;
  return true;
};

const parseTimestamp = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export interface RestoredWizardDraft {
  step: WizardDraftStep;
  input: PlanInput;
  result?: PlanOutput;
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

  const timestamp = parseTimestamp(parsed.timestamp);
  if (timestamp) {
    const ageMs = Date.now() - timestamp.getTime();
    if (ageMs > DRAFT_EXPIRY_MS) {
      return null;
    }
  }

  const restored: RestoredWizardDraft = {
    step: parsed.step,
    input: sanitizePlanInput(parsed.input, fallbackNetwork),
  };

  if (parsed.result && isValidPlanOutput(parsed.result)) {
    restored.result = parsed.result as PlanOutput;
  }

  return restored;
};
