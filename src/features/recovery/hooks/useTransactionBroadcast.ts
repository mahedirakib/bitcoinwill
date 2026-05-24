import { useState, useCallback } from 'react';
import type { BitcoinNetwork } from '@/lib/bitcoin/types';
import type {
  BroadcastTransactionResult,
  ExplorerProvider
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
  explorerProvider: ExplorerProvider
): UseTransactionBroadcastReturn => {
  const { showToast } = useToast();
  const [rawTxHex, setRawTxHex] = useState('');
  const [broadcastMainnetPhrase, setBroadcastMainnetPhrase] = useState('');
  const {
    data: broadcastResult,
    isLoading: isBroadcasting,
    error: broadcastError,
    execute,
    reset: resetAsync,
  } = useAsyncState<BroadcastTransactionResult>();

  const publicExplorerAvailable = supportsPublicExplorerNetwork(network);
  const isMainnet = network === 'mainnet';

  const broadcastTransaction = useCallback(async () => {
    if (!publicExplorerAvailable) {
      const message = 'Public broadcast is unavailable on Regtest. Use your local node RPC instead.';
      showToast(message);
      return;
    }

    if (isMainnet && broadcastMainnetPhrase !== MAINNET_BROADCAST_CONFIRMATION) {
      const message = 'Mainnet broadcast requires the exact confirmation phrase.';
      showToast(message);
      return;
    }

    await execute(async () => {
      const result = await broadcastTx({
        network,
        provider: explorerProvider,
        rawTxHex,
        fallbackToOtherProvider: true,
      });
      showToast(`Broadcast accepted by ${result.providerLabel}`);
      return result;
    });
  }, [network, explorerProvider, rawTxHex, isMainnet, broadcastMainnetPhrase, showToast, publicExplorerAvailable, execute]);

  const clearBroadcastState = useCallback(() => {
    setRawTxHex('');
    setBroadcastMainnetPhrase('');
    resetAsync();
  }, [resetAsync]);

  return {
    rawTxHex,
    setRawTxHex,
    broadcastResult,
    broadcastError,
    isBroadcasting,
    broadcastMainnetPhrase,
    setBroadcastMainnetPhrase,
    broadcastTransaction,
    clearBroadcastState,
  };
};
