import { useState, useCallback, useRef, useEffect } from 'react';
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
import type { UseTransactionBroadcastReturn } from '../types';

const MAINNET_BROADCAST_CONFIRMATION = 'I UNDERSTAND THIS BROADCASTS ON MAINNET';

export const useTransactionBroadcast = (
  network: BitcoinNetwork,
  explorerProvider: ExplorerProvider
): UseTransactionBroadcastReturn => {
  const { showToast } = useToast();
  const [rawTxHex, setRawTxHex] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadcastTransactionResult | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMainnetPhrase, setBroadcastMainnetPhrase] = useState('');
  const isBroadcastingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const publicExplorerAvailable = supportsPublicExplorerNetwork(network);
  const isMainnet = network === 'mainnet';

  const broadcastTransaction = useCallback(async () => {
    if (isBroadcastingRef.current) return;

    if (!publicExplorerAvailable) {
      const message = 'Public broadcast is unavailable on Regtest. Use your local node RPC instead.';
      setBroadcastError(message);
      showToast(message);
      return;
    }

    if (isMainnet && broadcastMainnetPhrase !== MAINNET_BROADCAST_CONFIRMATION) {
      const message = 'Mainnet broadcast requires the exact confirmation phrase.';
      setBroadcastError(message);
      showToast(message);
      return;
    }

    isBroadcastingRef.current = true;
    setIsBroadcasting(true);
    setBroadcastError(null);
    setBroadcastResult(null);

    try {
      const result = await broadcastTx({
        network,
        provider: explorerProvider,
        rawTxHex,
        fallbackToOtherProvider: true,
      });
      if (!isMountedRef.current) return;
      setBroadcastResult(result);
      showToast(`Broadcast accepted by ${result.providerLabel}`);
    } catch (error) {
      if (!isMountedRef.current) return;
      const message = (error as Error).message || 'Transaction broadcast failed.';
      setBroadcastError(message);
      showToast(message);
    } finally {
      isBroadcastingRef.current = false;
      if (isMountedRef.current) {
        setIsBroadcasting(false);
      }
    }
  }, [network, explorerProvider, rawTxHex, isMainnet, broadcastMainnetPhrase, showToast, publicExplorerAvailable]);

  const clearBroadcastState = useCallback(() => {
    setRawTxHex('');
    setBroadcastResult(null);
    setBroadcastError(null);
    setBroadcastMainnetPhrase('');
  }, []);

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
