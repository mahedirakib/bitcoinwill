import { useReducer, useState, useEffect, useRef, useCallback } from 'react';
import * as ecc from 'tiny-secp256k1';
import { buildPlan } from '@/lib/bitcoin/planEngine';
import type { PlanOutput, BitcoinNetwork } from '@/lib/bitcoin/types';

import { downloadJson, downloadTxt } from '@/lib/utils/download';
import { useSettings } from '@/state/settings';
import { useToast } from '@/components/Toast';
import { useVaults } from '@/hooks/useVaults';
import { usesDisallowedSampleKey } from './safety';
import { parseWizardDraft } from './draftState';
import { buildSharePrintHtml, buildSharesText } from './shareExport';
import { splitPrivateKey } from '@/lib/bitcoin/sss';
import { bytesToHex, hexToBytes } from '@/lib/bitcoin/hex';
import { generateSecp256k1PrivateKey } from '@/lib/bitcoin/keygen';
import { connectHardwareWallet, type HardwareWalletType } from '@/lib/bitcoin/hardwareWallet';
import { createRecoveryKitExport, stripRecoveryKitSecrets } from './recoveryKit';
import { TypeStep } from './steps/TypeStep';
import { KeysStep } from './steps/KeysStep';
import { TimelockStep } from './steps/TimelockStep';
import { ReviewStep } from './steps/ReviewStep';
import { ResultStep } from './steps/ResultStep';
import { DownloadChecklistModal } from './components/DownloadChecklistModal';
import { HardwareWalletModal } from './components/HardwareWalletModal';
import { SSSPrivateKeyModal } from './components/SSSPrivateKeyModal';
import { StepErrorBoundary } from './components/StepErrorBoundary';
import { StepIndicator } from './components/StepIndicator';
import type { PlanInput } from '@/lib/bitcoin/types';
import {
  ChecklistItemId,
  STORAGE_KEY,
  createChecklistState,
  createInitialState,
  getStepNumber,
  type Step,
  wizardReducer,
} from './types';
import {
  getNextStep,
  getPreviousStep,
  canTransitionTo,
  getStepDefinition,
} from './stateMachine';

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
  const { saveNewVault, hasVault } = useVaults();
  const [state, dispatch] = useReducer(wizardReducer, createInitialState(network));
  const [hasRestored, setHasRestored] = useState(false);
  const [showDownloadChecklist, setShowDownloadChecklist] = useState(false);
  const [downloadChecklist, setDownloadChecklist] = useState<Record<ChecklistItemId, boolean>>(createChecklistState);
  const [showHardwareWallet, setShowHardwareWallet] = useState(false);
  const [hardwareWalletConnected, setHardwareWalletConnected] = useState<HardwareWalletType | null>(null);
  const [pendingSSSKey, setPendingSSSKey] = useState<string | null>(null);
  const [pendingSSSConfig, setPendingSSSConfig] = useState<{ threshold: 2 | 3; total: 3 | 5 } | null>(null);
  const [isVaultSaved, setIsVaultSaved] = useState(false);
  const isProcessingSSSRef = useRef(false);
  const printTimeoutRef = useRef<number | null>(null);

  const clearDraftState = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors in restricted browser contexts.
    }
  }, []);

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
  }, [hasRestored, network, showToast, dispatch]);

  useEffect(() => {
    if (!hasRestored) return;
    if (state.step === 'RESULT') {
      clearDraftState();
      return;
    }

    const dataToSave = {
      step: state.step,
      input: state.input,
      result: state.result ? stripRecoveryKitSecrets(state.result) : null,
      timestamp: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Ignore storage errors
    }
  }, [state.step, state.input, state.result, hasRestored, clearDraftState]);

  useEffect(() => {
    if (state.step !== 'RESULT') {
      dispatch({ type: 'UPDATE_INPUT', payload: { network: network as BitcoinNetwork } });
    }
  }, [network, state.step, dispatch]);

  const nextStep = () => {
    const next = getNextStep(state.step);
    if (next && canTransitionTo(state.step, next, state)) {
      dispatch({ type: 'SET_STEP', payload: next });
    } else if (state.step === 'TYPE' || state.step === 'KEYS') {
      const validation = getStepDefinition(state.step).validate(state);
      if (validation) {
        dispatch({ type: 'SET_ERRORS', payload: validation });
      }
    }
  };

  const prevStep = () => {
    const prev = getPreviousStep(state.step);
    if (prev && canTransitionTo(state.step, prev, state)) {
      dispatch({ type: 'SET_STEP', payload: prev });
    }
  };

  const handleGenerate = async () => {
    if (
      state.input.network === 'mainnet' &&
      usesDisallowedSampleKey(
        state.input.owner_pubkey,
        state.input.recovery_method === 'social' ? '' : state.input.beneficiary_pubkey,
      )
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

        const privateKey = generateSecp256k1PrivateKey();
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
      dispatch({ type: 'SET_COMPLETED_PLAN', payload: { input: planInput, result } });
      clearDraftState();
    } catch (e) {
      dispatch({ type: 'SET_ERRORS', payload: { global: (e as Error).message } });
    }
  };

  const completeSSSGeneration = async () => {
    if (!pendingSSSKey || !pendingSSSConfig || isProcessingSSSRef.current) return;
    isProcessingSSSRef.current = true;

    try {
      const planInput = { ...state.input };
      const publicKey = ecc.pointFromScalar(hexToBytes(pendingSSSKey), true);

      if (!publicKey) {
        throw new Error('Failed to regenerate beneficiary keypair');
      }

      planInput.beneficiary_pubkey = bytesToHex(publicKey);
      const socialKit = await splitPrivateKey(pendingSSSKey, pendingSSSConfig);
      const baseResult = buildPlan(planInput);
      const result: PlanOutput = { ...baseResult, social_recovery_kit: socialKit };

      setPendingSSSKey(null);
      setPendingSSSConfig(null);
      dispatch({ type: 'SET_COMPLETED_PLAN', payload: { input: planInput, result } });
      clearDraftState();
    } catch (e) {
      dispatch({ type: 'SET_ERRORS', payload: { global: (e as Error).message } });
    } finally {
      isProcessingSSSRef.current = false;
    }
  };

  const cancelSSSGeneration = () => {
    setPendingSSSKey(null);
    setPendingSSSConfig(null);
  };

  const handleSaveVault = () => {
    if (!state.result) return;
    if (hasVault(state.result.address)) {
      showToast('This vault is already saved');
      setIsVaultSaved(true);
      return;
    }
    saveNewVault(state.input, state.result);
    setIsVaultSaved(true);
    showToast('Vault saved to My vaults');
  };

  const handleCancel = () => {
    clearDraftState();
    onCancel();
  };

  const handleDownload = () => {
    if (!state.result) return;
    try {
      const exportData = createRecoveryKitExport(state.input, state.result);
      downloadJson(`recovery-kit-${state.result.address.slice(0, 8)}.json`, exportData);
      showToast("Recovery Kit Downloaded");
    } catch (e) {
      showToast(`Download failed: ${(e as Error).message}`);
    }
  };

  const copyToClipboard = async (text: string, label: string): Promise<boolean> => {
    try {
      if (!navigator.clipboard?.writeText) {
        showToast('Clipboard unavailable in this browser context');
        return false;
      }

      await navigator.clipboard.writeText(text);
      showToast(`${label} Copied`);
      return true;
    } catch {
      showToast('Clipboard unavailable in this browser context');
      return false;
    }
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

    try {
      const html = buildSharePrintHtml(result);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');

      if (!printWindow) {
        URL.revokeObjectURL(url);
        showToast('Please allow popups to print share cards');
        return;
      }

      printWindow.opener = null;

      // Allow browser to render before printing
      if (printTimeoutRef.current) {
        window.clearTimeout(printTimeoutRef.current);
      }
      printTimeoutRef.current = window.setTimeout(() => {
        printWindow.print();
        URL.revokeObjectURL(url);
      }, 250);
    } catch {
      showToast('Failed to open print dialog');
    }
  };

  useEffect(() => {
    return () => {
      if (printTimeoutRef.current) {
        window.clearTimeout(printTimeoutRef.current);
      }
    };
  }, []);

  const downloadSharesAsTxt = (result: PlanOutput) => {
    if (!result.social_recovery_kit) return;
    downloadTxt(`bitcoin-will-shares-${result.address.slice(0, 8)}.txt`, buildSharesText(result));
    
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

  const stepNumber = getStepNumber(state.step);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {state.step !== 'RESULT' && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="section-eyebrow">Step {stepNumber} of 4</p>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <StepIndicator current={state.step as Step} />
        </div>
      )}

      <div className={state.step === 'RESULT' ? '' : 'panel p-6 md:p-8'}>
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
              onSaveVault={handleSaveVault}
              isVaultSaved={isVaultSaved}
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
