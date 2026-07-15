import { useState, useCallback, useRef } from 'react';
import type { BitcoinNetwork } from '@/lib/bitcoin/types';
import type {
  BroadcastTransactionResult,
  ExplorerProvider,
  VaultSpendContext,
} from '@/lib/bitcoin/explorer';
import {
  broadcastTransaction as broadcastTx,
  supportsPublicExplorerNetwork
} from '@/lib/bitcoin/explorer';
import { useToast } from '@/components/Toast';
import { useAsyncState } from '@/hooks/useAsyncState';
import type { UseTransactionBroadcastReturn } from '../types';

const MAINNET_BROADCAST_CONFIRMATION = 'I UNDERSTAND THIS BROADCASTS ON MAINNET';

export const useTransactionBroadcast = (
  network: BitcoinNetwork,
  explorerProvider: ExplorerProvider,
  vault?: Omit<VaultSpendContext, 'destinationAddress'>,
): UseTransactionBroadcastReturn => {
  const { showToast } = useToast();
  const [rawTxHex, setRawTxHexState] = useState('');
  const [recoveryDestination, setRecoveryDestinationState] = useState('');
  const [broadcastMainnetPhrase, setBroadcastMainnetPhrase] = useState('');
  const isBroadcastingRef = useRef(false);
  const {
    data: broadcastResult,
    isLoading: isBroadcasting,
    error: broadcastError,
    execute,
    reset: resetAsync,
  } = useAsyncState<BroadcastTransactionResult>();

  const publicExplorerAvailable = supportsPublicExplorerNetwork(network);
  const isMainnet = network === 'mainnet';

  const setRawTxHex = useCallback((value: string) => {
    if (isBroadcastingRef.current) return;
    setRawTxHexState(value);
    resetAsync();
  }, [resetAsync]);

  const setRecoveryDestination = useCallback((value: string) => {
    if (isBroadcastingRef.current) return;
    setRecoveryDestinationState(value);
    resetAsync();
  }, [resetAsync]);

  const broadcastTransaction = useCallback(async () => {
    if (isBroadcastingRef.current) return;
    if (!publicExplorerAvailable) {
      const message = 'Public broadcast is unavailable on Regtest. Use your local node RPC instead.';
      showToast(message, 'error');
      return;
    }

    if (isMainnet && broadcastMainnetPhrase !== MAINNET_BROADCAST_CONFIRMATION) {
      const message = 'Mainnet broadcast requires the exact confirmation phrase.';
      showToast(message, 'error');
      return;
    }

    isBroadcastingRef.current = true;
    try {
      await execute(async () => {
        const result = await broadcastTx({
          network,
          provider: explorerProvider,
          rawTxHex,
          fallbackToOtherProvider: true,
          vault: vault ? { ...vault, destinationAddress: recoveryDestination } : undefined,
        });
        showToast(`Broadcast accepted by ${result.providerLabel}`);
        return result;
      });
    } finally {
      isBroadcastingRef.current = false;
    }
  }, [network, explorerProvider, rawTxHex, isMainnet, broadcastMainnetPhrase, showToast, publicExplorerAvailable, execute, vault, recoveryDestination]);

  const clearBroadcastState = useCallback(() => {
    setRawTxHexState('');
    setRecoveryDestinationState('');
    setBroadcastMainnetPhrase('');
    resetAsync();
  }, [resetAsync]);

  return {
    rawTxHex,
    setRawTxHex,
    recoveryDestination,
    setRecoveryDestination,
    broadcastResult,
    broadcastError,
    isBroadcasting,
    broadcastMainnetPhrase,
    setBroadcastMainnetPhrase,
    broadcastTransaction,
    clearBroadcastState,
  };
};
