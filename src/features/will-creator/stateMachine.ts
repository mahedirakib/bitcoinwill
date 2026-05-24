import type { Step, WizardState } from './types';
import { validatePubkey } from '@/lib/bitcoin/validation';
import { normalizePubkeyHex } from './safety';

export interface StepDefinition {
  id: Step;
  stepNumber: number;
  label: string;
  canGoBack: boolean;
  canGoNext: boolean;
  validate: (state: WizardState) => Record<string, string> | null;
}

export const STEP_DEFINITIONS: Record<Step, StepDefinition> = {
  TYPE: {
    id: 'TYPE',
    stepNumber: 1,
    label: 'Type Selection',
    canGoBack: false,
    canGoNext: true,
    validate: (state) => {
      if (state.input.recovery_method === 'social' && !state.input.sss_config) {
        return { sss: 'Please select a share configuration (2-of-3 or 3-of-5)' };
      }
      return null;
    },
  },
  KEYS: {
    id: 'KEYS',
    stepNumber: 2,
    label: 'Key Entry',
    canGoBack: true,
    canGoNext: true,
    validate: (state) => {
      const errors: Record<string, string> = {};
      const ownerPubkey = normalizePubkeyHex(state.input.owner_pubkey);
      const beneficiaryPubkey = normalizePubkeyHex(state.input.beneficiary_pubkey);
      const usesGeneratedBeneficiaryKey = state.input.recovery_method === 'social';

      if (!validatePubkey(ownerPubkey)) errors.owner = 'Invalid public key format (must be 66 hex characters).';
      if (!usesGeneratedBeneficiaryKey) {
        if (!validatePubkey(beneficiaryPubkey)) errors.beneficiary = 'Invalid public key format.';
        if (ownerPubkey === beneficiaryPubkey) errors.beneficiary = 'Keys must be different.';
      }
      return Object.keys(errors).length > 0 ? errors : null;
    },
  },
  TIMELOCK: {
    id: 'TIMELOCK',
    stepNumber: 3,
    label: 'Timelock Settings',
    canGoBack: true,
    canGoNext: true,
    validate: () => null,
  },
  REVIEW: {
    id: 'REVIEW',
    stepNumber: 4,
    label: 'Review',
    canGoBack: true,
    canGoNext: false,
    validate: () => null,
  },
  RESULT: {
    id: 'RESULT',
    stepNumber: 5,
    label: 'Results',
    canGoBack: false,
    canGoNext: false,
    validate: () => null,
  },
};

export const STEP_ORDER: Step[] = ['TYPE', 'KEYS', 'TIMELOCK', 'REVIEW', 'RESULT'];

export const getStepDefinition = (step: Step): StepDefinition => STEP_DEFINITIONS[step];

export const getNextStep = (currentStep: Step): Step | null => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) return null;
  return STEP_ORDER[currentIndex + 1];
};

export const getPreviousStep = (currentStep: Step): Step | null => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex <= 0) return null;
  return STEP_ORDER[currentIndex - 1];
};

export const canTransitionTo = (currentStep: Step, targetStep: Step, state: WizardState): boolean => {
  const currentDef = STEP_DEFINITIONS[currentStep];
  const targetIndex = STEP_ORDER.indexOf(targetStep);
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  if (targetIndex === currentIndex) return true;

  // Can only go to RESULT from REVIEW with a valid result
  if (targetStep === 'RESULT') {
    return currentStep === 'REVIEW' && state.result !== null;
  }

  // Can go back if current step allows it
  if (targetIndex < currentIndex) {
    return currentDef.canGoBack;
  }

  // Can go forward if current step validates
  if (targetIndex > currentIndex) {
    if (!currentDef.canGoNext) return false;
    const validation = currentDef.validate(state);
    return validation === null;
  }

  return false;
};

export const getTotalSteps = (): number => STEP_ORDER.filter((step) => step !== 'RESULT').length;
