import { useState, useCallback, useRef, useEffect } from 'react';
import type { BitcoinNetwork } from '@/lib/bitcoin/types';
import type {
  AddressSummary,
  ExplorerProvider
} from '@/lib/bitcoin/explorer';
import {
  fetchAddressSummary,
  supportsPublicExplorerNetwork
} from '@/lib/bitcoin/explorer';
import { useToast } from '@/components/Toast';
import { useAsyncState } from '@/hooks/useAsyncState';
import type { UseVaultStatusReturn } from '../types';

const MIN_REFRESH_INTERVAL_MS = 5000;

export const useVaultStatus = (
  network: BitcoinNetwork,
  address: string | undefined
): UseVaultStatusReturn => {
  const { showToast } = useToast();
  const [explorerProvider, setExplorerProvider] = useState<ExplorerProvider>('mempool');
  const { data: vaultStatus, isLoading: isCheckingStatus, error: statusError, execute, reset: resetAsync } = useAsyncState<AddressSummary>();
  const lastRefreshByAddressRef = useRef<Map<string, number>>(new Map());

  const publicExplorerAvailable = supportsPublicExplorerNetwork(network);

  useEffect(() => {
    lastRefreshByAddressRef.current.delete(address ?? '');
  }, [address]);

  const refreshVaultStatus = useCallback(async () => {
    if (!address) return;

    if (!publicExplorerAvailable) {
      const message = 'Public explorers do not support Regtest. Connect a local node for live status.';
      showToast(message, 'error');
      return;
    }

    const now = Date.now();
    const lastRefresh = lastRefreshByAddressRef.current.get(address) ?? 0;
    const timeSinceLastRefresh = now - lastRefresh;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
      const secondsRemaining = Math.ceil((MIN_REFRESH_INTERVAL_MS - timeSinceLastRefresh) / 1000);
      const message = `Please wait ${secondsRemaining} second${secondsRemaining > 1 ? 's' : ''} before refreshing again`;
      showToast(message, 'info');
      return;
    }

    lastRefreshByAddressRef.current.set(address, now);

    await execute(async () => {
      const summary = await fetchAddressSummary({
        network,
        address,
        provider: explorerProvider,
        fallbackToOtherProvider: true,
      });
      showToast(`Vault status updated via ${summary.providerLabel}`);
      return summary;
    });
  }, [address, explorerProvider, network, showToast, publicExplorerAvailable, execute]);

  const clearVaultStatus = useCallback(() => {
    resetAsync();
    lastRefreshByAddressRef.current.clear();
  }, [resetAsync]);

  return {
    vaultStatus,
    statusError,
    isCheckingStatus,
    explorerProvider,
    setExplorerProvider,
    refreshVaultStatus,
    clearVaultStatus,
  };
};
