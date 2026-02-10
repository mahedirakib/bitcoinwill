import { useReducer, useState, useEffect } from 'react';
import {
  ChevronRight,
  CheckCircle2,
  Download,
  AlertTriangle,
  Clock,
  HelpCircle,
  FileText,
  Copy,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { buildPlan } from '@/lib/bitcoin/planEngine';
import { PlanInput, PlanOutput, type BitcoinNetwork } from '@/lib/bitcoin/types';
import { validatePubkey } from '@/lib/bitcoin/validation';
import { calculateTime } from '@/lib/bitcoin/utils';
import { downloadJson } from '@/lib/utils/download';
import { useSettings } from '@/state/settings';
import { useToast } from '@/components/Toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SAMPLE_KEYS, normalizePubkeyHex, usesDisallowedSampleKey } from './safety';

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

const createInitialState = (network: BitcoinNetwork | 'mainnet'): WizardState => ({
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

const STORAGE_KEY = 'bitcoinwill_wizard_state';

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

export const WillCreatorWizard = ({ onCancel, onViewInstructions }: { onCancel: () => void, onViewInstructions: (data: unknown) => void }) => {
  const { network } = useSettings();
  const { showToast } = useToast();
  const [state, dispatch] = useReducer(wizardReducer, createInitialState(network));
  const [showKeyHelp, setShowKeyHelp] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    if (hasRestored) return;
    
    try {
      // Session-only draft storage avoids persisting plan details across browser restarts.
      const saved = sessionStorage.getItem(STORAGE_KEY);
      // Clean up any stale legacy draft persisted by older versions.
      localStorage.removeItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.input && parsed.step && parsed.step !== 'RESULT') {
          dispatch({ type: 'UPDATE_INPUT', payload: parsed.input });
          dispatch({ type: 'SET_STEP', payload: parsed.step });
          showToast('Previous progress restored');
        }
      }
    } catch {
      // Ignore errors when restoring draft state
    }
    setHasRestored(true);
  }, [hasRestored, showToast]);

  useEffect(() => {
    if (!hasRestored || state.step === 'RESULT') return;
    
    const dataToSave = {
      step: state.step,
      input: state.input,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [state.step, state.input, hasRestored]);

  useEffect(() => {
    if (state.step !== 'RESULT') {
      dispatch({ type: 'UPDATE_INPUT', payload: { network: network as BitcoinNetwork } });
    }
  }, [network, state.step]);

  const nextStep = () => {
    if (state.step === 'TYPE') dispatch({ type: 'SET_STEP', payload: 'KEYS' });
    else if (state.step === 'KEYS') {
      const errors: Record<string, string> = {};
      const ownerPubkey = normalizePubkeyHex(state.input.owner_pubkey);
      const beneficiaryPubkey = normalizePubkeyHex(state.input.beneficiary_pubkey);

      if (!validatePubkey(ownerPubkey)) errors.owner = 'Invalid public key format (must be 66 hex characters).';
      if (!validatePubkey(beneficiaryPubkey)) errors.beneficiary = 'Invalid public key format.';
      if (ownerPubkey === beneficiaryPubkey) errors.beneficiary = 'Keys must be different.';
      
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
    if (
      state.input.network === 'mainnet' &&
      usesDisallowedSampleKey(state.input.owner_pubkey, state.input.beneficiary_pubkey)
    ) {
      dispatch({
        type: 'SET_ERRORS',
        payload: {
          global: 'Sample keys are not allowed on Mainnet. Use real owner and beneficiary public keys.',
        },
      });
      return;
    }

    try {
      const result = buildPlan(state.input);
      dispatch({ type: 'SET_RESULT', payload: result });
      dispatch({ type: 'SET_STEP', payload: 'RESULT' });
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      dispatch({ type: 'SET_ERRORS', payload: { global: (e as Error).message } });
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    onCancel();
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
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(`${label} Copied`))
      .catch(() => showToast('Clipboard unavailable in this browser context'));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12">
      {state.step !== 'RESULT' && (
        <div className="mb-16 space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-4xl font-black tracking-tight">New Spending Plan</h2>
              <p className="text-foreground/60 font-medium">Follow the steps to secure your inheritance.</p>
            </div>
            <span className="text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
              Step {getStepNumber(state.step)} of 4
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary shadow-lg shadow-primary/20 transition-all duration-700 ease-out"
              style={{ width: `${(getStepNumber(state.step) / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-10">
        {state.step === 'TYPE' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-3 text-center">
              <h3 className="text-2xl font-bold">Choose your inheritance strategy</h3>
              <p className="text-foreground/50 max-w-xl mx-auto font-medium">This app creates technical spending plans, not legal documents.</p>
            </div>
            <div className="glass p-10 border-primary/20 bg-primary/5 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity">
                <Clock className="w-40 h-40" />
              </div>
              <div className="flex gap-6 relative">
                <div className="bg-primary shadow-lg shadow-primary/20 p-4 rounded-2xl h-fit">
                  <Clock className="text-primary-foreground w-8 h-8" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-bold">Timelock Recovery</h4>
                  <p className="text-lg text-foreground/70 leading-relaxed font-medium">
                    Maintain 100% control of your funds. If you stop moving your Bitcoin for a specific period, 
                    a secondary key (your heir) becomes eligible to claim the funds.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-6">
              <button type="button" onClick={handleCancel} className="text-foreground/40 font-bold hover:text-foreground/60 transition-colors">Cancel</button>
              <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {state.step === 'KEYS' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Identify the players</h3>
              <p className="text-foreground/50 font-medium">Provide the 66-character compressed public keys.</p>
            </div>

            <button 
              type="button"
              onClick={() => setShowKeyHelp(!showKeyHelp)}
              aria-expanded={showKeyHelp}
              aria-controls="public-key-help"
              className="flex items-center gap-2 text-primary text-sm font-bold hover:opacity-80 transition-opacity"
            >
              <HelpCircle className="w-4 h-4" /> What is a Public Key?
            </button>

            {showKeyHelp && (
              <div id="public-key-help" className="p-6 bg-muted rounded-2xl text-sm text-foreground/60 border border-border space-y-3 font-medium leading-relaxed animate-in fade-in zoom-in-95">
                <p>A <strong>Public Key</strong> allows you to receive funds and create scripts. It is <strong>NOT</strong> a private key and cannot be used alone to spend your money.</p>
              </div>
            )}

            <div className="space-y-10">
              <div className="space-y-3">
                <label htmlFor="owner-pubkey" className="text-sm font-bold tracking-tight flex justify-between">
                  Owner Public Key
                  {state.input.network !== 'mainnet' ? (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: SAMPLE_KEYS.owner }})}
                      className="text-[10px] text-primary hover:underline uppercase tracking-widest font-black"
                    >
                      Use Sample
                    </button>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest font-black text-red-500/70">Sample Disabled</span>
                  )}
                </label>
                <input 
                  id="owner-pubkey"
                  type="text" 
                  value={state.input.owner_pubkey}
                  onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: normalizePubkeyHex(e.target.value) }})}
                  aria-invalid={Boolean(state.errors.owner)}
                  aria-describedby={state.errors.owner ? 'owner-pubkey-error' : undefined}
                  className={cn("w-full bg-muted border p-5 rounded-2xl font-mono text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20", state.errors.owner ? "border-red-500/50 shadow-sm" : "border-border hover:border-primary/20 focus:border-primary/50")}
                  placeholder="02..."
                />
                {state.errors.owner && <p id="owner-pubkey-error" className="text-xs text-red-500 font-bold">{state.errors.owner}</p>}
              </div>

              <div className="space-y-3">
                <label htmlFor="beneficiary-pubkey" className="text-sm font-bold tracking-tight flex justify-between">
                  Beneficiary Public Key
                  {state.input.network !== 'mainnet' ? (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { beneficiary_pubkey: SAMPLE_KEYS.beneficiary }})}
                      className="text-[10px] text-primary hover:underline uppercase tracking-widest font-black"
                    >
                      Use Sample
                    </button>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest font-black text-red-500/70">Sample Disabled</span>
                  )}
                </label>
                <input 
                  id="beneficiary-pubkey"
                  type="text" 
                  value={state.input.beneficiary_pubkey}
                  onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { beneficiary_pubkey: normalizePubkeyHex(e.target.value) }})}
                  aria-invalid={Boolean(state.errors.beneficiary)}
                  aria-describedby={state.errors.beneficiary ? 'beneficiary-pubkey-error' : undefined}
                  className={cn("w-full bg-muted border p-5 rounded-2xl font-mono text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20", state.errors.beneficiary ? "border-red-500/50 shadow-sm" : "border-border hover:border-primary/20 focus:border-primary/50")}
                  placeholder="03..."
                />
                {state.errors.beneficiary && <p id="beneficiary-pubkey-error" className="text-xs text-red-500 font-bold">{state.errors.beneficiary}</p>}
              </div>
            </div>

            {state.input.network === 'mainnet' && (
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs text-red-600/80 font-semibold">
                Sample keys are disabled on Mainnet for safety.
              </div>
            )}

            <div className="flex justify-between items-center pt-6">
              <button type="button" onClick={prevStep} className="text-foreground/60 font-bold hover:text-foreground/80 transition-colors">Back</button>
              <button type="button" onClick={nextStep} className="btn-primary">Continue</button>
            </div>
          </div>
        )}

        {state.step === 'TIMELOCK' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Set the Delay</h3>
              <p className="text-foreground/60 font-medium">How long should the network wait before allowing your heir to claim funds?</p>
            </div>

            <div className="glass p-12 space-y-12">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-6xl font-black text-primary">{state.input.locktime_blocks}</span>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">Network Blocks</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">Approx. Delay</p>
                  <p className="text-4xl font-black">~{calculateTime(state.input.locktime_blocks)}</p>
                </div>
              </div>

              <div className="relative py-4">
                <label htmlFor="timelock-range" className="sr-only">
                  Timelock blocks
                </label>
                <input 
                  id="timelock-range"
                  aria-label="Timelock blocks"
                  type="range" min="1" max="52560" step="1"
                  value={state.input.locktime_blocks}
                  onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { locktime_blocks: parseInt(e.target.value) }})}
                  className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-xs text-orange-600/70 space-y-3 font-medium leading-relaxed">
              <p>• The timer resets every time you move the funds.</p>
              <p>• The delay starts <strong>only after</strong> the funding transaction confirms on-chain.</p>
            </div>

            <div className="flex justify-between items-center pt-6">
              <button type="button" onClick={prevStep} className="text-foreground/60 font-bold hover:text-foreground/80 transition-colors">Back</button>
              <button type="button" onClick={nextStep} className="btn-primary">Continue</button>
            </div>
          </div>
        )}

        {state.step === 'REVIEW' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h3 className="text-2xl font-bold">Final Review</h3>
            <div className="glass p-8 space-y-6">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-60 font-bold uppercase tracking-widest">Network</span>
                <span className="font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-lg">{network}</span>
              </div>
              <div className="pt-6 border-t border-border space-y-2">
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Delay Settings</p>
                <p className="text-2xl font-black">{state.input.locktime_blocks} Blocks (~{calculateTime(state.input.locktime_blocks)})</p>
              </div>
            </div>

            {network === 'mainnet' && (
              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4 text-red-600 text-sm font-medium">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <p><strong>CAUTION:</strong> You are creating a plan on Mainnet. This involves real Bitcoin. Verify all keys carefully.</p>
              </div>
            )}

            {state.errors.global && (
              <div role="alert" className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-sm font-bold">
                <p>Error: {state.errors.global}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-6">
              <button type="button" onClick={prevStep} className="text-foreground/60 font-bold hover:text-foreground/80 transition-colors">Back</button>
              <button type="button" onClick={handleGenerate} className="btn-primary !px-16 !py-5">Generate Plan</button>
            </div>
          </div>
        )}

        {state.step === 'RESULT' && state.result && (
          <div className="space-y-12 animate-in zoom-in-95 duration-1000">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                <CheckCircle2 className="text-primary w-20 h-20 relative drop-shadow-lg" />
              </div>
              <h2 className="text-5xl font-black tracking-tight">Plan Secured</h2>
              <p className="text-foreground/70 text-lg font-medium">Your Vault Address is ready for funding.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 items-start">
              <div className="lg:col-span-3 space-y-6">
                <div className="glass p-8 space-y-5">
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Vault Address ({state.result.network})</h4>
                  <div className="flex gap-3">
                    <div className="flex-1 p-5 bg-muted border border-border rounded-2xl font-mono text-xs break-all leading-relaxed shadow-inner">
                      {state.result.address}
                    </div>
                    <button
                      type="button"
                      aria-label="Copy vault address"
                      onClick={() => copyToClipboard(state.result!.address, 'Address')}
                      className="p-4 bg-white border border-border rounded-2xl hover:bg-muted transition-colors group shadow-sm"
                    >
                      <Copy className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>

                <div className="glass p-8 space-y-4">
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Witness Script</h4>
                  <div className="flex gap-3">
                    <pre className="flex-1 p-5 bg-muted border border-border rounded-2xl text-[10px] font-mono overflow-x-auto opacity-80 leading-relaxed shadow-inner">
                      {state.result.script_asm}
                    </pre>
                    <button
                      type="button"
                      aria-label="Copy witness script hex"
                      onClick={() => copyToClipboard(state.result!.script_hex, 'Script')}
                      className="p-4 bg-white border border-border rounded-2xl h-fit hover:bg-muted transition-colors group shadow-sm"
                    >
                      <Copy className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4 pt-4">
                <div className="glass p-6 space-y-4">
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                    <QrCode className="w-3 h-3" /> Scan to Fund
                  </h4>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <QRCodeSVG
                      value={state.result.address}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-[10px] text-foreground/60 text-center">
                    Scan with your mobile wallet
                  </p>
                </div>

                <button type="button" onClick={handleDownload} className="w-full btn-primary !bg-foreground !text-background flex items-center justify-center gap-3">
                  <Download className="w-6 h-6" /> Download Recovery Kit
                </button>
                <button type="button" onClick={() => onViewInstructions({ plan: state.input, result: state.result, created_at: new Date().toISOString() })} className="w-full btn-secondary flex items-center justify-center gap-3 shadow-sm">
                  <FileText className="w-6 h-6 text-primary" /> View Instructions
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
