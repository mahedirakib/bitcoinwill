import { useState, useCallback, useRef } from 'react';
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
  const lastRefreshRef = useRef<number>(0);

  const publicExplorerAvailable = supportsPublicExplorerNetwork(network);

  const refreshVaultStatus = useCallback(async () => {
    if (!address) return;

    if (!publicExplorerAvailable) {
      const message = 'Public explorers do not support Regtest. Connect a local node for live status.';
      showToast(message);
      return;
    }

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
      const secondsRemaining = Math.ceil((MIN_REFRESH_INTERVAL_MS - timeSinceLastRefresh) / 1000);
      const message = `Please wait ${secondsRemaining} second${secondsRemaining > 1 ? 's' : ''} before refreshing again`;
      showToast(message);
      return;
    }

    lastRefreshRef.current = now;

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
    lastRefreshRef.current = 0;
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
