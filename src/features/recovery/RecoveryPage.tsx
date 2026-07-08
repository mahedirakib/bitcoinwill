import { useState, useEffect, useRef } from 'react';
import * as ecc from 'tiny-secp256k1';
import type { InstructionModel } from '@/lib/bitcoin/instructions';
import {
  buildInstructions,
  generateInstructionTxt,
  validateAndNormalizeRecoveryKit,
} from '@/lib/bitcoin/instructions';
import { downloadTxt } from '@/lib/utils/download';
import type { BitcoinNetwork } from '@/lib/bitcoin/types';
import { useToast } from '@/components/Toast';
import { supportsPublicExplorerNetwork } from '@/lib/bitcoin/explorer';
import { bytesToHex, hexToBytes } from '@/lib/bitcoin/hex';
import { useVaultStatus } from './hooks/useVaultStatus';
import { useCheckInPlan } from './hooks/useCheckInPlan';
import { useTransactionBroadcast } from './hooks/useTransactionBroadcast';
import { RecoveryKitLoader } from './components/RecoveryKitLoader';
import { InstructionsView } from './components/InstructionsView';
import { VaultStatusPanel } from './components/VaultStatusPanel';
import { CheckInPanel } from './components/CheckInPanel';
import { BroadcastPanel } from './components/BroadcastPanel';
import { ShareRecovery } from './components/ShareRecovery';
import type { RecoveryPageProps } from './types';

const privateKeyMatchesBeneficiary = (privateKeyHex: string, beneficiaryPubkey: string): boolean => {
  try {
    const publicKey = ecc.pointFromScalar(hexToBytes(privateKeyHex), true);
    return publicKey ? bytesToHex(publicKey) === beneficiaryPubkey.toLowerCase() : false;
  } catch {
    return false;
  }
};

const RecoveryPage = ({ initialData, onBack }: RecoveryPageProps) => {
  const [model, setModel] = useState<InstructionModel | null>(null);
  const [showShareRecovery, setShowShareRecovery] = useState(false);
  const [reconstructedKey, setReconstructedKey] = useState<string | null>(null);
  const { showToast } = useToast();

  const recoveryNetwork = (model?.network.toLowerCase() ?? 'testnet') as BitcoinNetwork;
  const publicExplorerAvailable = supportsPublicExplorerNetwork(recoveryNetwork);

  const {
    vaultStatus,
    statusError,
    isCheckingStatus,
    explorerProvider,
    setExplorerProvider,
    refreshVaultStatus,
    clearVaultStatus,
  } = useVaultStatus(recoveryNetwork, model?.address);

  const [checkInCadence, setCheckInCadence] = useState(0.5);
  const { checkInPlan } = useCheckInPlan(
    model?.locktimeBlocks ?? 0,
    vaultStatus,
    checkInCadence
  );

  const {
    rawTxHex,
    setRawTxHex,
    broadcastResult,
    broadcastError,
    isBroadcasting,
    broadcastMainnetPhrase,
    setBroadcastMainnetPhrase,
    broadcastTransaction,
    clearBroadcastState,
  } = useTransactionBroadcast(recoveryNetwork, explorerProvider);

  const processedInitialDataRef = useRef<string | null>(null);

  useEffect(() => {
    // Use a stable key to avoid re-processing when only the object reference changes
    const dataKey = initialData
      ? `${initialData.plan?.owner_pubkey}-${initialData.result?.address}-${initialData.created_at}`
      : null;

    if (dataKey && dataKey !== processedInitialDataRef.current) {
      processedInitialDataRef.current = dataKey;
      try {
        const normalized = validateAndNormalizeRecoveryKit(initialData);
        const m = buildInstructions(normalized.plan, normalized.result, normalized.created_at);
        setModel(m);
      } catch (error) {
        showToast((error as Error).message || 'Invalid Recovery Kit', 'error');
      }
    }
  }, [initialData, showToast]);

  const vaultIdentifier = model ? `${model.address}-${model.network}` : '';
  useEffect(() => {
    clearVaultStatus();
    clearBroadcastState();
  }, [vaultIdentifier, clearVaultStatus, clearBroadcastState]);

  const handleLoadModel = (loadedModel: InstructionModel) => {
    if (
      reconstructedKey &&
      !privateKeyMatchesBeneficiary(reconstructedKey, loadedModel.beneficiaryPubkey)
    ) {
      setReconstructedKey(null);
      showToast('Reconstructed key does not match this Recovery Kit beneficiary key.', 'error');
    }
    setModel(loadedModel);
  };

  const handleKeyReconstructed = (privateKeyHex: string) => {
    if (model && !privateKeyMatchesBeneficiary(privateKeyHex, model.beneficiaryPubkey)) {
      showToast('Reconstructed key does not match this Recovery Kit beneficiary key.', 'error');
      setShowShareRecovery(false);
      return;
    }

    setReconstructedKey(privateKeyHex);
    showToast(model ? 'Private key verified against the Recovery Kit.' : 'Private key reconstructed. Load the Recovery Kit to verify it.');
    setShowShareRecovery(false);
  };

  const handleDownloadTxt = () => {
    if (model) {
      downloadTxt('beneficiary-instructions.txt', generateInstructionTxt(model));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBackToLoader = () => {
    setShowShareRecovery(false);
    setReconstructedKey(null);
    setModel(null);
  };

  if (showShareRecovery) {
    return (
      <ShareRecovery
        onKeyReconstructed={handleKeyReconstructed}
        onCancel={handleBackToLoader}
        beneficiaryPubkey={model?.beneficiaryPubkey}
      />
    );
  }

  if (!model) {
    return (
      <RecoveryKitLoader
        onLoad={handleLoadModel}
        onBack={onBack}
        onSocialRecovery={() => setShowShareRecovery(true)}
      />
    );
  }

  return (
    <InstructionsView
      model={model}
      onDownloadTxt={handleDownloadTxt}
      onPrint={handlePrint}
      onBack={handleBackToLoader}
    >
      {publicExplorerAvailable ? (
        <>
          <VaultStatusPanel
            model={model}
            vaultStatus={vaultStatus}
            statusError={statusError}
            isCheckingStatus={isCheckingStatus}
            explorerProvider={explorerProvider}
            onProviderChange={setExplorerProvider}
            onRefresh={refreshVaultStatus}
          />

          <CheckInPanel
            model={model}
            vaultStatus={vaultStatus}
            checkInPlan={checkInPlan}
            checkInCadence={checkInCadence}
            onCadenceChange={setCheckInCadence}
          />

          <BroadcastPanel
            model={model}
            rawTxHex={rawTxHex}
            onRawTxHexChange={setRawTxHex}
            broadcastResult={broadcastResult}
            broadcastError={broadcastError}
            isBroadcasting={isBroadcasting}
            broadcastMainnetPhrase={broadcastMainnetPhrase}
            onBroadcastMainnetPhraseChange={setBroadcastMainnetPhrase}
            onBroadcast={broadcastTransaction}
            reconstructedKey={reconstructedKey}
          />
        </>
      ) : (
        <div className="rounded-md border border-warning/30 bg-warning-bg p-3 text-sm leading-relaxed text-warning print:hidden">
          Regtest is local-only. For live status, query your own node or local Esplora instance.
        </div>
      )}
    </InstructionsView>
  );
};

export default RecoveryPage;
