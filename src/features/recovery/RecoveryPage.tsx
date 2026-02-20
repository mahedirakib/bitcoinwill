import { useState, useEffect } from 'react';
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
import {
  useVaultStatus,
  useCheckInPlan,
  useTransactionBroadcast,
  RecoveryKitLoader,
  InstructionsView,
  VaultStatusPanel,
  CheckInPanel,
  BroadcastPanel,
  ShareRecovery,
} from '@/features/recovery';
import type { RecoveryPageProps } from '@/features/recovery';

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

  useEffect(() => {
    if (initialData?.plan && initialData?.result) {
      try {
        const normalized = validateAndNormalizeRecoveryKit(initialData);
        const m = buildInstructions(normalized.plan, normalized.result, normalized.created_at);
        setModel(m);
      } catch (error) {
        showToast((error as Error).message || 'Invalid Recovery Kit');
      }
    }
  }, [initialData, showToast]);

  const vaultIdentifier = model ? `${model.address}-${model.network}` : '';
  useEffect(() => {
    clearVaultStatus();
    clearBroadcastState();
  }, [vaultIdentifier, clearVaultStatus, clearBroadcastState]);

  const handleLoadModel = (loadedModel: InstructionModel) => {
    setModel(loadedModel);
  };

  const handleKeyReconstructed = (privateKeyHex: string) => {
    setReconstructedKey(privateKeyHex);
    showToast('Private key reconstructed. Proceed to claim.');
    // Note: We still need the recovery kit to get the vault details
    // The beneficiary should load the recovery kit OR enter vault details manually
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
        <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 text-sm text-orange-700 leading-relaxed print:hidden">
          Regtest is local-only. For live status, query your own node or local Esplora instance.
        </div>
      )}
    </InstructionsView>
  );
};

export default RecoveryPage;
