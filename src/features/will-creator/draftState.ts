import {
  INHERITANCE_TYPE,
  isAddressType,
  isBitcoinNetwork,
  type BitcoinNetwork,
  type PlanInput,
  type PlanOutput,
  type KeyOrigin,
} from '@/lib/bitcoin/types';
import { validateAndNormalizeRecoveryKit } from '@/lib/bitcoin/instructions';
import { normalizePubkeyHex } from './safety';
import { stripRecoveryKitSecrets } from './recoveryKit';

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

const sanitizeRecoveryMethod = (value: unknown): PlanInput['recovery_method'] | undefined =>
  value === 'single' || value === 'social' ? value : undefined;

const sanitizeSssConfig = (value: unknown): PlanInput['sss_config'] | undefined => {
  if (!isObjectRecord(value)) return undefined;

  const { threshold, total } = value;
  if (
    (threshold === 2 && total === 3) ||
    (threshold === 3 && total === 5)
  ) {
    return { threshold, total };
  }

  return undefined;
};

const sanitizePlanLabel = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const sanitizeKeyOrigin = (value: unknown): KeyOrigin | undefined => {
  if (!isObjectRecord(value)) return undefined;
  if (value.device !== 'ledger' && value.device !== 'trezor' && value.device !== 'coldcard') return undefined;
  if (typeof value.derivation_path !== 'string' || !/^m(?:\/\d+['h]?)*$/.test(value.derivation_path)) return undefined;
  const fingerprint = typeof value.fingerprint === 'string' && /^[a-f0-9]{8}$/i.test(value.fingerprint)
    ? value.fingerprint.toLowerCase()
    : undefined;
  return { device: value.device, derivation_path: value.derivation_path, fingerprint };
};

const sanitizePlanInput = (value: Record<string, unknown>, fallbackNetwork: BitcoinNetwork): PlanInput => {
  const recoveryMethod = sanitizeRecoveryMethod(value.recovery_method);
  const sssConfig = recoveryMethod === 'social' ? sanitizeSssConfig(value.sss_config) : undefined;

  return {
    network: isBitcoinNetwork(value.network) ? value.network : fallbackNetwork,
    inheritance_type: INHERITANCE_TYPE,
    owner_pubkey: sanitizePubkey(value.owner_pubkey),
    beneficiary_pubkey: sanitizePubkey(value.beneficiary_pubkey),
    locktime_blocks: sanitizeLocktime(value.locktime_blocks),
    address_type: isAddressType(value.address_type) ? value.address_type : undefined,
    recovery_method: recoveryMethod,
    sss_config: sssConfig,
    plan_label: sanitizePlanLabel(value.plan_label),
    owner_key_origin: sanitizeKeyOrigin(value.owner_key_origin),
    beneficiary_key_origin: sanitizeKeyOrigin(value.beneficiary_key_origin),
  };
};

const isValidPlanOutput = (value: unknown): value is PlanOutput => {
  if (!isObjectRecord(value)) return false;
  if (typeof value.address !== 'string') return false;
  if (typeof value.script_hex !== 'string') return false;
  return true;
};

const normalizePlanOutput = (input: PlanInput, result: PlanOutput): PlanOutput | null => {
  try {
    return validateAndNormalizeRecoveryKit({ plan: input, result }).result;
  } catch {
    return null;
  }
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
  /**
   * True when the persisted draft was on the RESULT step with social recovery
   * enabled. The result (and its SSS shares) are intentionally stripped from
   * persisted drafts, so the user is rolled back to REVIEW. Generating again
   * will produce a *new* random beneficiary key — shares from a previous
   * session cannot be reused — so callers should warn the user.
   */
  socialResultDropped?: boolean;
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
  // A missing or malformed timestamp is treated as expired rather than as
  // "no expiry check" — otherwise stale or tampered drafts with a bad
  // timestamp would bypass the 1-hour expiry window indefinitely.
  if (!timestamp) {
    return null;
  }
  const ageMs = Date.now() - timestamp.getTime();
  if (ageMs > DRAFT_EXPIRY_MS) {
    return null;
  }
  // Also reject drafts dated in the future (clock skew / tampering).
  if (ageMs < -60_000) {
    return null;
  }

  const input = sanitizePlanInput(parsed.input, fallbackNetwork);
  const restoresSocialResult = parsed.step === 'RESULT' && input.recovery_method === 'social';
  const normalizedResult =
    !restoresSocialResult && parsed.result && isValidPlanOutput(parsed.result)
      ? normalizePlanOutput(input, parsed.result)
      : null;
  const restoredResult = normalizedResult
    ? stripRecoveryKitSecrets(normalizedResult)
    : undefined;

  const restored: RestoredWizardDraft = {
    step: parsed.step === 'RESULT' && !restoredResult ? 'REVIEW' : parsed.step,
    input,
    socialResultDropped: restoresSocialResult || undefined,
  };

  if (restoredResult) {
    restored.result = restoredResult;
  }

  return restored;
};
