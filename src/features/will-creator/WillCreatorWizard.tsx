import { useReducer, useState, useEffect } from 'react';
import * as ecc from 'tiny-secp256k1';
import { buildPlan } from '@/lib/bitcoin/planEngine';
import type { PlanOutput, BitcoinNetwork } from '@/lib/bitcoin/types';
import { validatePubkey } from '@/lib/bitcoin/validation';
import { downloadJson } from '@/lib/utils/download';
import { useSettings } from '@/state/settings';
import { useToast } from '@/components/Toast';
import { normalizePubkeyHex, usesDisallowedSampleKey } from './safety';
import { parseWizardDraft } from './draftState';
import { splitPrivateKey } from '@/lib/bitcoin/sss';
import { bytesToHex } from '@/lib/bitcoin/hex';
import { connectHardwareWallet, type HardwareWalletType } from '@/lib/bitcoin/hardwareWallet';
import { TypeStep } from './steps/TypeStep';
import { KeysStep } from './steps/KeysStep';
import { TimelockStep } from './steps/TimelockStep';
import { ReviewStep } from './steps/ReviewStep';
import { ResultStep } from './steps/ResultStep';
import { DownloadChecklistModal } from './components/DownloadChecklistModal';
import { HardwareWalletModal } from './components/HardwareWalletModal';
import { SSSPrivateKeyModal } from './components/SSSPrivateKeyModal';
import { StepErrorBoundary } from './components/StepErrorBoundary';
import type { PlanInput } from '@/lib/bitcoin/types';
import {
  ChecklistItemId,
  STORAGE_KEY,
  createChecklistState,
  createInitialState,
  getStepNumber,
  wizardReducer,
} from './types';

export interface InstructionData {
  plan: PlanInput;
  result: PlanOutput;
  created_at?: string;
}

interface WillCreatorWizardProps {
  onCancel: () => void;
  onViewInstructions: (data: InstructionData) => void;
}

export const WillCreatorWizard = ({ onCancel, onViewInstructions }: WillCreatorWizardProps) => {
  const { network } = useSettings();
  const { showToast } = useToast();
  const [state, dispatch] = useReducer(wizardReducer, createInitialState(network));
  const [hasRestored, setHasRestored] = useState(false);
  const [showDownloadChecklist, setShowDownloadChecklist] = useState(false);
  const [downloadChecklist, setDownloadChecklist] = useState<Record<ChecklistItemId, boolean>>(createChecklistState);
  const [showHardwareWallet, setShowHardwareWallet] = useState(false);
  const [hardwareWalletConnected, setHardwareWalletConnected] = useState<HardwareWalletType | null>(null);
  const [pendingSSSKey, setPendingSSSKey] = useState<string | null>(null);
  const [pendingSSSConfig, setPendingSSSConfig] = useState<{ threshold: 2 | 3; total: 3 | 5 } | null>(null);

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
      savedDraft = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }

    const restored = parseWizardDraft(savedDraft, network as BitcoinNetwork);
    if (restored) {
      dispatch({ type: 'UPDATE_INPUT', payload: restored.input });
      dispatch({ type: 'SET_STEP', payload: restored.step });
      if (restored.result && restored.step === 'RESULT') {
        dispatch({ type: 'SET_RESULT', payload: restored.result });
      }
      showToast('Previous progress restored');
    }
    setHasRestored(true);
  }, [hasRestored, network, showToast]);

  useEffect(() => {
    if (!hasRestored) return;

    const dataToSave = {
      step: state.step,
      input: state.input,
      result: state.result,
      timestamp: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Ignore storage errors
    }
  }, [state.step, state.input, state.result, hasRestored]);

  useEffect(() => {
    if (state.step !== 'RESULT') {
      dispatch({ type: 'UPDATE_INPUT', payload: { network: network as BitcoinNetwork } });
    }
  }, [network, state.step]);

  const nextStep = () => {
    if (state.step === 'TYPE') {
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

      if (state.input.recovery_method === 'social') {
        if (!state.input.sss_config) {
          throw new Error('SSS configuration not set');
        }

        const randomBytes = crypto.getRandomValues(new Uint8Array(32));
        const privateKey = randomBytes;
        const publicKey = ecc.pointFromScalar(privateKey, true);
        
        if (!publicKey) {
          throw new Error('Failed to generate beneficiary keypair');
        }

        planInput.beneficiary_pubkey = bytesToHex(publicKey);
        setPendingSSSKey(bytesToHex(privateKey));
        setPendingSSSConfig(state.input.sss_config);
        return;
      }

      const result = buildPlan(planInput);
      dispatch({ type: 'SET_RESULT', payload: result });
      dispatch({ type: 'SET_STEP', payload: 'RESULT' });
      clearDraftState();
    } catch (e) {
      dispatch({ type: 'SET_ERRORS', payload: { global: (e as Error).message } });
    }
  };

  const completeSSSGeneration = async () => {
    if (!pendingSSSKey || !pendingSSSConfig) return;

    try {
      const planInput = { ...state.input };
      const publicKey = ecc.pointFromScalar(Buffer.from(pendingSSSKey, 'hex'), true);
      
      if (!publicKey) {
        throw new Error('Failed to regenerate beneficiary keypair');
      }

      planInput.beneficiary_pubkey = bytesToHex(publicKey);
      const socialKit = await splitPrivateKey(pendingSSSKey, pendingSSSConfig);
      const result = buildPlan(planInput);
      result.social_recovery_kit = socialKit;

      setPendingSSSKey(null);
      setPendingSSSConfig(null);
      dispatch({ type: 'SET_RESULT', payload: result });
      dispatch({ type: 'SET_STEP', payload: 'RESULT' });
      clearDraftState();
    } catch (e) {
      dispatch({ type: 'SET_ERRORS', payload: { global: (e as Error).message } });
    }
  };

  const cancelSSSGeneration = () => {
    setPendingSSSKey(null);
    setPendingSSSConfig(null);
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(`${label} Copied`))
      .catch(() => showToast('Clipboard unavailable in this browser context'));
  };

  const handleHardwareWalletConnect = async (type: HardwareWalletType) => {
    const { publicKey } = await connectHardwareWallet(type, network as BitcoinNetwork);
    dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: publicKey } });
    setHardwareWalletConnected(type);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} connected successfully`);
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
          .card { background: white; border: 2px solid #f97316; border-radius: 12px; padding: 24px; margin-bottom: 20px; page-break-inside: avoid; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #f97316; color: white; padding: 12px 24px; margin: -24px -24px 20px -24px; border-radius: 10px 10px 0 0; font-weight: bold; font-size: 18px; }
          .share-number { font-size: 48px; font-weight: bold; color: #f97316; }
          .share-data { font-family: monospace; font-size: 11px; background: #f5f5f5; padding: 12px; border-radius: 8px; word-break: break-all; margin: 16px 0; }
          .info { font-size: 12px; color: #666; margin-top: 16px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 16px; font-size: 12px; }
          @media print { body { background: white; } .card { box-shadow: none; break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0;">Bitcoin Will - Social Recovery Shares</h1>
          <p style="color: #666; margin: 8px 0;">Vault: ${result.address.slice(0, 20)}...${result.address.slice(-10)}</p>
          <p style="color: #f97316; font-weight: bold;">${config.threshold}-of-${config.total} Configuration</p>
        </div>
        ${shares.map(share => `
          <div class="card">
            <div class="header">Social Recovery Share #${share.index}</div>
            <div class="share-number">${share.index}</div>
            <div class="share-data">${share.share}</div>
            <div class="info"><strong>This is Share ${share.index} of ${config.total}</strong><br>Store this card in a safe place. Any ${config.threshold} shares can recover the funds.</div>
            <div class="warning">⚠️ <strong>Important:</strong> Do not store multiple shares in the same location. Give this card to a trusted person who understands what it's for.</div>
          </div>
        `).join('')}
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
          <strong>Recovery Instructions:</strong><br>To claim funds, the beneficiary needs:<br>1. This share (or ${config.threshold - 1} other shares)<br>2. The Recovery Kit file<br>3. Access to the Bitcoin Will app
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
${shares.map(s => `--- SHARE ${s.index} OF ${config.total} ---
${s.share}`).join('\n')}

RECOVERY PROCESS:
To claim funds, the beneficiary needs:
1. ${config.threshold} shares (including this one or others)
2. The Recovery Kit JSON file
3. Access to the Bitcoin Will app (self-host or use GitHub Pages)

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
    setShowDownloadChecklist(false);
    setDownloadChecklist(createChecklistState());
  };

  const closeDownloadChecklist = () => {
    setShowDownloadChecklist(false);
    setDownloadChecklist(createChecklistState());
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
          <StepErrorBoundary stepName="Type Selection" onReset={() => dispatch({ type: 'SET_STEP', payload: 'TYPE' })}>
            <TypeStep
              input={state.input}
              errors={state.errors}
              dispatch={dispatch}
              onCancel={handleCancel}
              onNext={nextStep}
            />
          </StepErrorBoundary>
        )}

        {state.step === 'KEYS' && (
          <StepErrorBoundary stepName="Key Entry" onReset={() => dispatch({ type: 'SET_STEP', payload: 'KEYS' })}>
            <KeysStep
              input={state.input}
              errors={state.errors}
              hardwareWalletConnected={hardwareWalletConnected}
              dispatch={dispatch}
              setShowHardwareWallet={setShowHardwareWallet}
              clearHardwareWalletKey={clearHardwareWalletKey}
              onBack={prevStep}
              onNext={nextStep}
            />
          </StepErrorBoundary>
        )}

        {state.step === 'TIMELOCK' && (
          <StepErrorBoundary stepName="Timelock Settings" onReset={() => dispatch({ type: 'SET_STEP', payload: 'TIMELOCK' })}>
            <TimelockStep
              input={state.input}
              dispatch={dispatch}
              onBack={prevStep}
              onNext={nextStep}
            />
          </StepErrorBoundary>
        )}

        {state.step === 'REVIEW' && (
          <StepErrorBoundary stepName="Review" onReset={() => dispatch({ type: 'SET_STEP', payload: 'REVIEW' })}>
            <ReviewStep
              input={state.input}
              errors={state.errors}
              network={network as BitcoinNetwork}
              onBack={prevStep}
              onGenerate={handleGenerate}
            />
          </StepErrorBoundary>
        )}

        {state.step === 'RESULT' && state.result && (
          <StepErrorBoundary stepName="Results">
            <ResultStep
              result={state.result}
              onOpenDownloadChecklist={() => setShowDownloadChecklist(true)}
              onViewInstructions={() => {
                if (!state.result) return;
                onViewInstructions({ plan: state.input, result: state.result, created_at: new Date().toISOString() });
              }}
              onCopyToClipboard={copyToClipboard}
              onPrintShares={printShares}
              onDownloadShares={downloadSharesAsTxt}
            />
          </StepErrorBoundary>
        )}
      </div>

      {showDownloadChecklist && (
        <DownloadChecklistModal
          checklist={downloadChecklist}
          onUpdateChecklist={updateChecklist}
          onConfirm={confirmChecklistAndDownload}
          onClose={closeDownloadChecklist}
        />
      )}

      {showHardwareWallet && (
        <HardwareWalletModal
          onConnect={handleHardwareWalletConnect}
          onClose={() => setShowHardwareWallet(false)}
        />
      )}

      {pendingSSSKey && (
        <SSSPrivateKeyModal
          privateKey={pendingSSSKey}
          onConfirm={completeSSSGeneration}
          onCancel={cancelSSSGeneration}
        />
      )}
    </div>
  );
};
