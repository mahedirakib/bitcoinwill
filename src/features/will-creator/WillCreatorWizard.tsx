import React, { useReducer, useState, useEffect } from 'react';
import { 
  Shield, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Download, 
  AlertTriangle,
  Clock,
  HelpCircle,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { buildPlan } from '@/lib/bitcoin/planEngine';
import { PlanInput, PlanOutput } from '@/lib/bitcoin/types';
import { validatePubkey } from '@/lib/bitcoin/validation';
import { downloadJson } from '@/lib/utils/download';
import { useSettings } from '@/state/settings';
import { useToast } from '@/components/Toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types & Constants ---

type Step = 'TYPE' | 'KEYS' | 'TIMELOCK' | 'REVIEW' | 'RESULT';

interface WizardState {
  step: Step;
  input: PlanInput;
  result: PlanOutput | null;
  errors: Record<string, string>;
}

type WizardAction = 
  | { type: 'SET_STEP'; payload: Step }
  | { type: 'UPDATE_INPUT'; payload: Partial<PlanInput> }
  | { type: 'SET_RESULT'; payload: PlanOutput }
  | { type: 'SET_ERRORS'; payload: Record<string, string> };

const createInitialState = (network: any): WizardState => ({
  step: 'TYPE',
  input: {
    network: network,
    inheritance_type: 'timelock_recovery',
    owner_pubkey: '',
    beneficiary_pubkey: '',
    locktime_blocks: 144, // ~1 day
  },
  result: null,
  errors: {},
});

const SAMPLE_KEYS = {
  owner: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
  beneficiary: '03a634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
};

// --- Reducer ---

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.payload, errors: {} };
    case 'UPDATE_INPUT': return { ...state, input: { ...state.input, ...action.payload } };
    case 'SET_RESULT': return { ...state, result: action.payload };
    case 'SET_ERRORS': return { ...state, errors: action.payload };
    default: return state;
  }
}

// --- Components ---

export const WillCreatorWizard = ({ onCancel, onViewInstructions }: { onCancel: () => void, onViewInstructions: (data: any) => void }) => {
  const { network } = useSettings();
  const { showToast } = useToast();
  const [state, dispatch] = useReducer(wizardReducer, createInitialState(network));
  const [showKeyHelp, setShowKeyHelp] = useState(false);

  useEffect(() => {
    if (state.step !== 'RESULT') {
      dispatch({ type: 'UPDATE_INPUT', payload: { network: network as any } });
    }
  }, [network]);

  const nextStep = () => {
    if (state.step === 'TYPE') dispatch({ type: 'SET_STEP', payload: 'KEYS' });
    else if (state.step === 'KEYS') {
      const errors: Record<string, string> = {};
      if (!validatePubkey(state.input.owner_pubkey)) errors.owner = 'Invalid public key format (must be 66 hex characters).';
      if (!validatePubkey(state.input.beneficiary_pubkey)) errors.beneficiary = 'Invalid public key format.';
      if (state.input.owner_pubkey === state.input.beneficiary_pubkey) errors.beneficiary = 'Keys must be different.';
      
      if (Object.keys(errors).length > 0) dispatch({ type: 'SET_ERRORS', payload: errors });
      else dispatch({ type: 'SET_STEP', payload: 'TIMELOCK' });
    }
    else if (state.step === 'TIMELOCK') dispatch({ type: 'SET_STEP', payload: 'REVIEW' });
  };

  const prevStep = () => {
    if (state.step === 'KEYS') dispatch({ type: 'SET_STEP', payload: 'TYPE' });
    else if (state.step === 'TIMELOCK') dispatch({ type: 'SET_STEP', payload: 'KEYS' });
    else if (state.step === 'REVIEW') dispatch({ type: 'SET_STEP', payload: 'TIMELOCK' });
  };

  const handleGenerate = () => {
    try {
      const result = buildPlan(state.input);
      dispatch({ type: 'SET_RESULT', payload: result });
      dispatch({ type: 'SET_STEP', payload: 'RESULT' });
    } catch (e: any) {
      dispatch({ type: 'SET_ERRORS', payload: { global: e.message } });
    }
  };

  const handleDownload = () => {
    if (!state.result) return;
    const exportData = {
      version: '0.1.0',
      created_at: new Date().toISOString(),
      plan: state.input,
      result: state.result,
    };
    downloadJson(`recovery-kit-${state.result.address.slice(0, 8)}.json`, exportData);
    showToast("Recovery Kit Downloaded");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} Copied`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      {state.step !== 'RESULT' && (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold">New Spending Plan</h2>
            <span className="text-sm font-mono text-foreground/40">Step {getStepNumber(state.step)} of 4</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(getStepNumber(state.step) / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-8">
        {state.step === 'TYPE' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Choose your inheritance strategy</h3>
              <p className="text-foreground/60">This app creates technical spending plans, not legal documents.</p>
            </div>
            <div className="glass p-6 border-primary/40 bg-primary/5">
              <div className="flex gap-4">
                <div className="bg-primary/20 p-3 rounded-xl h-fit">
                  <Clock className="text-primary w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">Timelock Recovery</h4>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    You maintain 100% control of your funds. If you stop moving your Bitcoin for a specific period, 
                    a secondary key (your heir) becomes eligible to claim the funds.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={onCancel} className="text-foreground/60 px-4 py-2">Cancel</button>
              <button onClick={nextStep} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {state.step === 'KEYS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Identify the players</h3>
              <p className="text-foreground/60">Provide the 66-character compressed public keys.</p>
            </div>

            <button 
              onClick={() => setShowKeyHelp(!showKeyHelp)}
              className="flex items-center gap-2 text-primary text-sm font-medium hover:underline"
            >
              <HelpCircle className="w-4 h-4" /> What is a Public Key?
            </button>

            {showKeyHelp && (
              <div className="p-4 bg-zinc-900 rounded-xl text-sm text-foreground/70 border border-white/5 space-y-2">
                <p>A <strong>Public Key</strong> allows you to receive funds and create scripts. It is <strong>NOT</strong> a private key and cannot be used alone to spend your money.</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold flex justify-between">
                  Owner Public Key
                  <button onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: SAMPLE_KEYS.owner }})} className="text-[10px] text-primary">Use Sample</button>
                </label>
                <input 
                  type="text" 
                  value={state.input.owner_pubkey}
                  onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: e.target.value.trim() }})}
                  className={cn("w-full bg-background border p-4 rounded-xl font-mono text-sm outline-none transition-all", state.errors.owner ? "border-red-500/50" : "border-border")}
                  placeholder="02..."
                />
                {state.errors.owner && <p className="text-xs text-red-400">{state.errors.owner}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex justify-between">
                  Beneficiary Public Key
                  <button onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { beneficiary_pubkey: SAMPLE_KEYS.beneficiary }})} className="text-[10px] text-primary">Use Sample</button>
                </label>
                <input 
                  type="text" 
                  value={state.input.beneficiary_pubkey}
                  onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { beneficiary_pubkey: e.target.value.trim() }})}
                  className={cn("w-full bg-background border p-4 rounded-xl font-mono text-sm outline-none transition-all", state.errors.beneficiary ? "border-red-500/50" : "border-border")}
                  placeholder="03..."
                />
                {state.errors.beneficiary && <p className="text-xs text-red-400">{state.errors.beneficiary}</p>}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="text-foreground/60 px-4 py-2">Back</button>
              <button onClick={nextStep} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold">Continue</button>
            </div>
          </div>
        )}

        {state.step === 'TIMELOCK' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Set the Delay (Blocks)</h3>
              <p className="text-foreground/60">How long should the network wait before allowing your heir to claim funds?</p>
            </div>

            <div className="glass p-8 space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-4xl font-bold text-primary">{state.input.locktime_blocks}</span>
                  <span className="ml-2 text-foreground/40 font-medium">Blocks</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Approx. Delay</p>
                  <p className="text-xl font-bold">~{calculateTime(state.input.locktime_blocks)}</p>
                </div>
              </div>

              <input 
                type="range" min="1" max="52560" step="144"
                value={state.input.locktime_blocks}
                onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { locktime_blocks: parseInt(e.target.value) }})}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-xs text-yellow-200/80 space-y-2">
              <p>• The timer resets every time you move the funds.</p>
              <p>• The delay starts <strong>only after</strong> the funding transaction confirms on-chain.</p>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="text-foreground/60 px-4 py-2">Back</button>
              <button onClick={nextStep} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold">Continue</button>
            </div>
          </div>
        )}

        {state.step === 'REVIEW' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-bold">Final Review</h3>
            <div className="glass p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-40">Network</span>
                <span className="font-bold uppercase text-primary">{network}</span>
              </div>
              <div className="pt-4 border-t border-white/5 space-y-1">
                <p className="text-xs font-bold opacity-40 uppercase">Delay</p>
                <p className="text-lg font-bold">{state.input.locktime_blocks} Blocks (~{calculateTime(state.input.locktime_blocks)})</p>
              </div>
            </div>

            {network === 'mainnet' && (
              <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-xl flex gap-3 text-red-400 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p><strong>CAUTION:</strong> You are creating a plan on Mainnet. This involves real Bitcoin.</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="text-foreground/60 px-4 py-2">Back</button>
              <button onClick={handleGenerate} className="bg-primary text-primary-foreground px-12 py-4 rounded-xl font-bold text-lg">Generate Plan</button>
            </div>
          </div>
        )}

        {state.step === 'RESULT' && state.result && (
          <div className="space-y-8 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <CheckCircle2 className="text-primary w-12 h-12 mx-auto mb-4" />
              <h2 className="text-4xl font-bold">Plan Generated</h2>
              <p className="text-foreground/60">Your Vault Address is ready for funding.</p>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-3 space-y-6">
                <div className="glass p-6 space-y-4">
                  <h4 className="font-bold text-xs uppercase opacity-40">Vault Address ({network})</h4>
                  <div className="flex gap-2">
                    <div className="flex-1 p-4 bg-background border border-border rounded-xl font-mono text-xs break-all">
                      {state.result.address}
                    </div>
                    <button onClick={() => copyToClipboard(state.result!.address, 'Address')} className="p-3 bg-zinc-900 border border-white/5 rounded-lg hover:bg-zinc-800">
                      <Copy className="w-4 h-4 opacity-40" />
                    </button>
                  </div>
                </div>

                <div className="glass p-6 space-y-2">
                  <h4 className="font-bold text-xs uppercase opacity-40">Witness Script</h4>
                  <div className="flex gap-2">
                    <pre className="flex-1 p-4 bg-background border border-border rounded-xl text-[10px] font-mono overflow-x-auto opacity-60">
                      {state.result.script_asm}
                    </pre>
                    <button onClick={() => copyToClipboard(state.result!.script_hex, 'Script')} className="p-3 bg-zinc-900 border border-white/5 rounded-lg h-fit">
                      <Copy className="w-4 h-4 opacity-40" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <button onClick={handleDownload} className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-bold">
                  <Download className="w-5 h-5" /> Download Recovery Kit
                </button>
                <button onClick={() => onViewInstructions({ plan: state.input, result: state.result, created_at: new Date().toISOString() })} className="w-full flex items-center justify-center gap-3 bg-primary/10 text-primary py-4 rounded-xl font-bold">
                  <FileText className="w-5 h-5" /> View Instructions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getStepNumber(step: Step): number {
  switch (step) {
    case 'TYPE': return 1;
    case 'KEYS': return 2;
    case 'TIMELOCK': return 3;
    case 'REVIEW': return 4;
    default: return 4;
  }
}

function calculateTime(blocks: number): string {
  const minutes = blocks * 10;
  const days = minutes / 1440;
  if (days < 1) return `${Math.round(minutes / 60)} hours`;
  if (days < 30) return `${Math.round(days)} days`;
  const months = days / 30.44;
  if (months < 12) return `${Math.round(months)} months`;
  return `${(days / 365.25).toFixed(1)} years`;
}