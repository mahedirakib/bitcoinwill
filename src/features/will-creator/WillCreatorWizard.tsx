import { useReducer, useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  CheckCircle2,
  Download,
  AlertTriangle,
  Clock,
  HelpCircle,
  FileText,
  Copy,
  QrCode,
  Users,
  Printer,
  Wallet,
  Shield,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as ecc from 'tiny-secp256k1';
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
import { parseWizardDraft } from './draftState';
import { splitPrivateKey } from '@/lib/bitcoin/sss';
import { bytesToHex } from '@/lib/bitcoin/hex';
import {
  connectHardwareWallet,
  SUPPORTED_WALLETS,
  type HardwareWalletType,
} from '@/lib/bitcoin/hardwareWallet';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types & Constants ---

type Step = 'TYPE' | 'KEYS' | 'TIMELOCK' | 'REVIEW' | 'RESULT';
type ChecklistItemId =
  | 'verify_keys'
  | 'store_offline'
  | 'heir_plan'
  | 'test_small_amount';

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
    address_type: 'p2tr', // default to Taproot for new users
    recovery_method: 'single', // default to single key
  },
  result: null,
  errors: {},
});

const STORAGE_KEY = 'bitcoinwill_wizard_state';
const CHECKLIST_ITEMS: Array<{ id: ChecklistItemId; title: string; detail: string }> = [
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

const createChecklistState = (): Record<ChecklistItemId, boolean> => ({
  verify_keys: false,
  store_offline: false,
  heir_plan: false,
  test_small_amount: false,
});

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
  const [showDownloadChecklist, setShowDownloadChecklist] = useState(false);
  const [downloadChecklist, setDownloadChecklist] = useState<Record<ChecklistItemId, boolean>>(createChecklistState);
  const [showHardwareWallet, setShowHardwareWallet] = useState(false);
  const [hardwareWalletLoading, setHardwareWalletLoading] = useState(false);
  const [hardwareWalletError, setHardwareWalletError] = useState<string | null>(null);
  const [hardwareWalletConnected, setHardwareWalletConnected] = useState<HardwareWalletType | null>(null);
  const checklistModalRef = useRef<HTMLDivElement | null>(null);
  const checklistLastFocusedRef = useRef<HTMLElement | null>(null);
  const clearDraftState = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors in restricted browser contexts.
    }
  };

  useEffect(() => {
    if (hasRestored) return;
    
    let savedDraft: string | null = null;
    try {
      // Session-only draft storage avoids persisting plan details across browser restarts.
      savedDraft = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors in restricted browser contexts.
    }

    try {
      // Clean up any stale legacy draft persisted by older versions.
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors in restricted browser contexts.
    }

    const restored = parseWizardDraft(savedDraft, network as BitcoinNetwork);
    if (restored) {
      dispatch({ type: 'UPDATE_INPUT', payload: restored.input });
      dispatch({ type: 'SET_STEP', payload: restored.step });
      showToast('Previous progress restored');
    }
    setHasRestored(true);
  }, [hasRestored, network, showToast]);

  useEffect(() => {
    if (!hasRestored || state.step === 'RESULT') return;
    
    const dataToSave = {
      step: state.step,
      input: state.input,
      timestamp: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Ignore storage errors in restricted browser contexts.
    }
  }, [state.step, state.input, hasRestored]);

  useEffect(() => {
    if (state.step !== 'RESULT') {
      dispatch({ type: 'UPDATE_INPUT', payload: { network: network as BitcoinNetwork } });
    }
  }, [network, state.step]);

  useEffect(() => {
    if (!showDownloadChecklist) return;

    checklistLastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      const firstCheckbox = checklistModalRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      firstCheckbox?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDownloadChecklist(false);
        setDownloadChecklist(createChecklistState());
        return;
      }

      if (event.key !== 'Tab' || !checklistModalRef.current) return;
      const focusableElements = checklistModalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      checklistLastFocusedRef.current?.focus();
    };
  }, [showDownloadChecklist]);

  const nextStep = () => {
    if (state.step === 'TYPE') {
      // Validate social recovery config if enabled
      if (state.input.recovery_method === 'social' && !state.input.sss_config) {
        dispatch({ type: 'SET_ERRORS', payload: { sss: 'Please select a share configuration (2-of-3 or 3-of-5)' } });
        return;
      }
      dispatch({ type: 'SET_STEP', payload: 'KEYS' });
    }
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

  const handleGenerate = async () => {
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
      const planInput = { ...state.input };
      let socialKit = null;

      // If social recovery enabled, generate beneficiary keypair
      if (state.input.recovery_method === 'social') {
        // Generate random private key using Web Crypto API
        const randomBytes = crypto.getRandomValues(new Uint8Array(32));
        const privateKey = randomBytes;
        const publicKey = ecc.pointFromScalar(privateKey, true); // compressed
        
        if (!publicKey) {
          throw new Error('Failed to generate beneficiary keypair');
        }

        // Update input with generated beneficiary public key
        planInput.beneficiary_pubkey = bytesToHex(publicKey);

        // Split private key into shares
        if (!state.input.sss_config) {
          throw new Error('SSS configuration not set');
        }
        
        socialKit = await splitPrivateKey(bytesToHex(privateKey), state.input.sss_config);
      }

      const result = buildPlan(planInput);
      
      // Attach social recovery kit if applicable
      if (socialKit) {
        result.social_recovery_kit = socialKit;
      }
      
      dispatch({ type: 'SET_RESULT', payload: result });
      dispatch({ type: 'SET_STEP', payload: 'RESULT' });
      clearDraftState();
    } catch (e) {
      dispatch({ type: 'SET_ERRORS', payload: { global: (e as Error).message } });
    }
  };

  const handleCancel = () => {
    clearDraftState();
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

  const openDownloadChecklist = () => {
    setDownloadChecklist(createChecklistState());
    setShowDownloadChecklist(true);
  };

  const closeDownloadChecklist = () => {
    setShowDownloadChecklist(false);
    setDownloadChecklist(createChecklistState());
  };

  const updateChecklist = (item: ChecklistItemId) => {
    setDownloadChecklist((current) => ({ ...current, [item]: !current[item] }));
  };

  const confirmChecklistAndDownload = () => {
    const allChecked = Object.values(downloadChecklist).every(Boolean);
    if (!allChecked) {
      showToast('Confirm every safety item before downloading the Recovery Kit');
      return;
    }

    handleDownload();
    closeDownloadChecklist();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(`${label} Copied`))
      .catch(() => showToast('Clipboard unavailable in this browser context'));
  };

  const handleHardwareWalletConnect = async (type: HardwareWalletType) => {
    setHardwareWalletLoading(true);
    setHardwareWalletError(null);
    
    try {
      const { publicKey } = await connectHardwareWallet(type);
      dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: publicKey } });
      setHardwareWalletConnected(type);
      setShowHardwareWallet(false);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} connected successfully`);
    } catch (error) {
      setHardwareWalletError((error as Error).message);
    } finally {
      setHardwareWalletLoading(false);
    }
  };

  const clearHardwareWalletKey = () => {
    dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: '' } });
    setHardwareWalletConnected(null);
    showToast('Key cleared');
  };

  const printShares = (result: PlanOutput) => {
    if (!result.social_recovery_kit) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to print share cards');
      return;
    }

    const { shares, config } = result.social_recovery_kit;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bitcoin Will - Social Recovery Shares</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
          .card { 
            background: white; 
            border: 2px solid #f97316; 
            border-radius: 12px; 
            padding: 24px; 
            margin-bottom: 20px; 
            page-break-inside: avoid;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: #f97316; 
            color: white; 
            padding: 12px 24px; 
            margin: -24px -24px 20px -24px; 
            border-radius: 10px 10px 0 0;
            font-weight: bold;
            font-size: 18px;
          }
          .share-number { font-size: 48px; font-weight: bold; color: #f97316; }
          .share-data { 
            font-family: monospace; 
            font-size: 11px; 
            background: #f5f5f5; 
            padding: 12px; 
            border-radius: 8px; 
            word-break: break-all;
            margin: 16px 0;
          }
          .info { font-size: 12px; color: #666; margin-top: 16px; }
          .warning { 
            background: #fef3c7; 
            border-left: 4px solid #f59e0b; 
            padding: 12px; 
            margin-top: 16px;
            font-size: 12px;
          }
          @media print { 
            body { background: white; }
            .card { box-shadow: none; break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0;">Bitcoin Will - Social Recovery Shares</h1>
          <p style="color: #666; margin: 8px 0;">
            Vault: ${result.address.slice(0, 20)}...${result.address.slice(-10)}
          </p>
          <p style="color: #f97316; font-weight: bold;">
            ${config.threshold}-of-${config.total} Configuration
          </p>
        </div>
        
        ${shares.map(share => `
          <div class="card">
            <div class="header">Social Recovery Share #${share.index}</div>
            <div class="share-number">${share.index}</div>
            <div class="share-data">${share.share}</div>
            <div class="info">
              <strong>This is Share ${share.index} of ${config.total}</strong><br>
              Store this card in a safe place. Any ${config.threshold} shares can recover the funds.
            </div>
            <div class="warning">
              ⚠️ <strong>Important:</strong> Do not store multiple shares in the same location.
              Give this card to a trusted person who understands what it's for.
            </div>
          </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
          <strong>Recovery Instructions:</strong><br>
          To claim funds, the beneficiary needs:<br>
          1. This share (or ${config.threshold - 1} other shares)<br>
          2. The Recovery Kit file<br>
          3. Access to the Bitcoin Will app
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const downloadSharesAsTxt = (result: PlanOutput) => {
    if (!result.social_recovery_kit) return;
    
    const { shares, config } = result.social_recovery_kit;
    const content = `BITCOIN WILL - SOCIAL RECOVERY SHARES
======================================

Vault Address: ${result.address}
Configuration: ${config.threshold}-of-${config.total}
Generated: ${new Date().toISOString()}

INSTRUCTIONS:
- Distribute each share to a different trusted person
- Any ${config.threshold} shares can reconstruct the beneficiary key
- Never store all shares in one location

SHARES:
${shares.map(s => `
--- SHARE ${s.index} OF ${config.total} ---
${s.share}
`).join('\n')}

RECOVERY PROCESS:
To claim funds, the beneficiary needs:
1. ${config.threshold} shares (including this one or others)
2. The Recovery Kit JSON file
3. Access to the Bitcoin Will app at https://bitcoinwill.app

For support, visit: https://github.com/mahedirakib/bitcoinwill
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitcoin-will-shares-${result.address.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Shares downloaded');
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

            {/* Simple Taproot Toggle - defaults to on for new users */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Use Modern Address Format</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Recommended</span>
                </div>
                <p className="text-xs text-foreground/50">
                  Taproot (bc1p...) - Better privacy & lower fees
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { address_type: state.input.address_type === 'p2tr' ? 'p2wsh' : 'p2tr' } })}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  state.input.address_type === 'p2tr' ? "bg-primary" : "bg-muted-foreground/30"
                )}
                aria-label="Toggle Taproot address format"
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    state.input.address_type === 'p2tr' ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Social Recovery Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Enable Social Recovery</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">Advanced</span>
                </div>
                <p className="text-xs text-foreground/50">
                  Split beneficiary key among trusted people
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { recovery_method: state.input.recovery_method === 'social' ? 'single' : 'social' } })}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  state.input.recovery_method === 'social' ? "bg-orange-500" : "bg-muted-foreground/30"
                )}
                aria-label="Toggle social recovery"
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    state.input.recovery_method === 'social' ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Social Recovery Options */}
            {state.input.recovery_method === 'social' && (
              <div className="space-y-4 p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm font-medium text-orange-600/80">
                  Choose how to distribute trust among your recovery group:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { sss_config: { threshold: 2, total: 3 } } })}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      state.input.sss_config?.threshold === 2
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-border hover:border-orange-500/30"
                    )}
                  >
                    <div className="space-y-1">
                      <span className="text-sm font-bold">2-of-3 Shares</span>
                      <p className="text-xs text-foreground/60">
                        Any 2 of 3 people can recover
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { sss_config: { threshold: 3, total: 5 } } })}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      state.input.sss_config?.threshold === 3
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-border hover:border-orange-500/30"
                    )}
                  >
                    <div className="space-y-1">
                      <span className="text-sm font-bold">3-of-5 Shares</span>
                      <p className="text-xs text-foreground/60">
                        Any 3 of 5 people can recover
                      </p>
                    </div>
                  </button>
                </div>
                {!state.input.sss_config && (
                  <p className="text-xs text-orange-500 font-medium">
                    Please select a share configuration to continue
                  </p>
                )}
                {state.errors.sss && (
                  <p className="text-xs text-red-500 font-medium">{state.errors.sss}</p>
                )}
              </div>
            )}

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
              <h3 className="text-2xl font-bold">
                {state.input.recovery_method === 'social' ? 'Owner Identification' : 'Identify the players'}
              </h3>
              <p className="text-foreground/50 font-medium">
                {state.input.recovery_method === 'social' 
                  ? 'Provide your public key. The beneficiary key will be generated automatically for social recovery.' 
                  : 'Provide the 66-character compressed public keys.'}
              </p>
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

            {state.input.recovery_method === 'social' && (
              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-sm text-orange-600/80">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="font-bold">Social Recovery Enabled</span>
                </div>
                <p>The beneficiary's key will be automatically generated and split into shares for distribution.</p>
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
                
                {/* Hardware Wallet Connect */}
                <div className="flex items-center justify-between pt-2">
                  {hardwareWalletConnected ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-xs font-bold">
                        <Shield className="w-3.5 h-3.5" />
                        {hardwareWalletConnected.charAt(0).toUpperCase() + hardwareWalletConnected.slice(1)} Connected
                      </div>
                      <button
                        type="button"
                        onClick={clearHardwareWalletKey}
                        className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Clear key"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowHardwareWallet(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Hardware Wallet
                    </button>
                  )}
                  
                  {/* Security Tip */}
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-foreground/40">
                    <Shield className="w-3 h-3" />
                    <span>Hardware wallets are the gold standard</span>
                  </div>
                </div>
                
                {state.errors.owner && <p id="owner-pubkey-error" className="text-xs text-red-500 font-bold">{state.errors.owner}</p>}
              </div>

              {state.input.recovery_method !== 'social' && (
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
              )}
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
              {state.result.network === 'mainnet' && (
                <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-black uppercase tracking-widest">
                  <AlertTriangle className="w-3 h-3" /> Mainnet Address
                </p>
              )}
              {state.result.address_type === 'p2tr' && (
                <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                  Modern Format
                </p>
              )}
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

                {state.result.social_recovery_kit && (
                  <div className="glass p-8 space-y-6 border-orange-500/20 bg-orange-500/5">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-500" />
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Social Recovery Shares</h4>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-orange-500/10 text-sm text-orange-700 space-y-2">
                      <p className="font-bold">
                        {state.result.social_recovery_kit.config.threshold}-of-{state.result.social_recovery_kit.config.total} Configuration
                      </p>
                      <p className="text-xs">
                        Distribute these shares to trusted people. Any {state.result.social_recovery_kit.config.threshold} shares can reconstruct the beneficiary key.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {state.result.social_recovery_kit.shares.map((share) => (
                        <div key={share.index} className="space-y-3 p-4 bg-white rounded-xl border border-orange-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">Share {share.index}</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(share.share, `Share ${share.index}`)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Copy share"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-border inline-block">
                            <QRCodeSVG
                              value={share.share}
                              size={120}
                              bgColor="#ffffff"
                              fgColor="#000000"
                              level="H"
                            />
                          </div>
                          
                          <div className="p-2 bg-muted rounded-lg font-mono text-[9px] break-all text-foreground/60">
                            {share.share.slice(0, 32)}...{share.share.slice(-32)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => printShares(state.result!)}
                        className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print Share Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadSharesAsTxt(state.result!)}
                        className="flex-1 py-3 px-4 bg-muted text-foreground rounded-xl text-sm font-bold hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download All
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 text-xs space-y-2">
                      <p className="font-bold text-foreground/70">Distribution Tips:</p>
                      <ul className="space-y-1 text-foreground/50 list-disc list-inside">
                        <li>Print cards and give to different trusted people</li>
                        <li>Or scan QR codes to share via Signal/WhatsApp</li>
                        <li>Never store all shares in one location</li>
                        <li>Consider geographic distribution</li>
                      </ul>
                    </div>
                  </div>
                )}
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

                <button type="button" onClick={openDownloadChecklist} className="w-full btn-primary !bg-foreground !text-background flex items-center justify-center gap-3">
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

      {showDownloadChecklist && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-background/85 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            ref={checklistModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-checklist-title"
            aria-describedby="download-checklist-description"
            className="glass max-w-2xl w-full p-8 space-y-8 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-300"
          >
            <div className="space-y-3">
              <h3 id="download-checklist-title" className="text-3xl font-black tracking-tight">
                Checklist for Success
              </h3>
              <p id="download-checklist-description" className="text-sm text-foreground/70 font-medium">
                Confirm each safety item before downloading your Recovery Kit.
              </p>
            </div>

            <div className="space-y-3">
              {CHECKLIST_ITEMS.map((item) => (
                <label
                  key={item.id}
                  htmlFor={`checklist-${item.id}`}
                  className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-muted/50 hover:border-primary/20 transition-colors cursor-pointer"
                >
                  <input
                    id={`checklist-${item.id}`}
                    type="checkbox"
                    checked={downloadChecklist[item.id]}
                    onChange={() => updateChecklist(item.id)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="block text-xs text-foreground/60">{item.detail}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDownloadChecklist}
                className="flex-1 py-4 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={confirmChecklistAndDownload}
                disabled={!Object.values(downloadChecklist).every(Boolean)}
                className="flex-1 py-4 rounded-xl text-sm font-bold bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Confirm & Download
              </button>
            </div>
          </div>
        </div>
      )}
      {showHardwareWallet && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-background/85 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass max-w-md w-full p-8 space-y-6 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight">Connect Hardware Wallet</h3>
                <p className="text-sm text-foreground/70">
                  Select your device to automatically fill the public key.
                </p>
              </div>
            </div>

            {hardwareWalletError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{hardwareWalletError}</p>
              </div>
            )}

            <div className="space-y-3">
              {SUPPORTED_WALLETS.filter(w => w.supported).map((wallet) => (
                <button
                  key={wallet.type}
                  type="button"
                  onClick={() => handleHardwareWalletConnect(wallet.type)}
                  disabled={hardwareWalletLoading}
                  className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-all text-left disabled:opacity-50 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      <Wallet className="w-5 h-5 text-foreground/60 group-hover:text-primary" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold block">{wallet.label}</span>
                      <p className="text-xs text-foreground/60">{wallet.description}</p>
                    </div>
                    {hardwareWalletLoading ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-foreground/30 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 text-xs space-y-2">
              <div className="flex items-center gap-2 text-green-600 font-bold">
                <Shield className="w-4 h-4" />
                <span>Why use a hardware wallet?</span>
              </div>
              <ul className="space-y-1 text-foreground/60 list-disc list-inside pl-1">
                <li>Private keys never leave the device</li>
                <li>Verify addresses on the device screen</li>
                <li>Protection against malware and keyloggers</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 text-xs text-foreground/60 space-y-2">
              <p className="font-bold flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5" />
                Requirements
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Use Chrome, Edge, or Brave browser</li>
                <li>Connect device via USB cable</li>
                <li>Unlock device and approve the connection</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowHardwareWallet(false);
                  setHardwareWalletError(null);
                }}
                className="flex-1 py-4 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
