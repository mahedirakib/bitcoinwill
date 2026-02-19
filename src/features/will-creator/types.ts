import type { PlanInput, PlanOutput, BitcoinNetwork } from '@/lib/bitcoin/types';

export type Step = 'TYPE' | 'KEYS' | 'TIMELOCK' | 'REVIEW' | 'RESULT';

export type ChecklistItemId =
  | 'verify_keys'
  | 'store_offline'
  | 'heir_plan'
  | 'test_small_amount';

export interface WizardState {
  step: Step;
  input: PlanInput;
  result: PlanOutput | null;
  errors: Record<string, string>;
}

export type WizardAction =
  | { type: 'SET_STEP'; payload: Step }
  | { type: 'UPDATE_INPUT'; payload: Partial<PlanInput> }
  | { type: 'SET_RESULT'; payload: PlanOutput }
  | { type: 'SET_ERRORS'; payload: Record<string, string> };

export interface ChecklistItem {
  id: ChecklistItemId;
  title: string;
  detail: string;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'verify_keys',
    title: 'I verified both public keys belong to the correct people.',
    detail: 'A wrong key means the wrong person can spend funds.',
  },
  {
    id: 'store_offline',
    title: 'I will store the Recovery Kit in at least two safe locations.',
    detail: 'Keep backups offline (for example encrypted USB + printed copy).',
  },
  {
    id: 'heir_plan',
    title: 'My beneficiary knows where to find the kit and instructions.',
    detail: 'The beneficiary needs the kit and their own private key.',
  },
  {
    id: 'test_small_amount',
    title: 'I will test with a small amount before using larger funds.',
    detail: 'Run a full rehearsal on Testnet or with a small Mainnet amount first.',
  },
];

export const STORAGE_KEY = 'bitcoinwill_wizard_state';

export const createChecklistState = (): Record<ChecklistItemId, boolean> => ({
  verify_keys: false,
  store_offline: false,
  heir_plan: false,
  test_small_amount: false,
});

export const createInitialState = (network: BitcoinNetwork | 'mainnet'): WizardState => ({
  step: 'TYPE',
  input: {
    network: network as BitcoinNetwork,
    inheritance_type: 'timelock_recovery',
    owner_pubkey: '',
    beneficiary_pubkey: '',
    locktime_blocks: 144,
    address_type: 'p2tr',
    recovery_method: 'single',
  },
  result: null,
  errors: {},
});

export function getStepNumber(step: Step): number {
  switch (step) {
    case 'TYPE': return 1;
    case 'KEYS': return 2;
    case 'TIMELOCK': return 3;
    case 'REVIEW': return 4;
    default: return 4;
  }
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.payload, errors: {} };
    case 'UPDATE_INPUT': return { ...state, input: { ...state.input, ...action.payload } };
    case 'SET_RESULT': return { ...state, result: action.payload };
    case 'SET_ERRORS': return { ...state, errors: action.payload };
    default: return state;
  }
}
