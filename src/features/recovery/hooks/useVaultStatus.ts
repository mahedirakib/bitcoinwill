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

  const refreshVaultStatus = useCallback(async (): Promise<boolean> => {
    if (!address) return false;

    if (!publicExplorerAvailable) {
      const message = 'Public explorers do not support Regtest. Connect a local node for live status.';
      showToast(message, 'error');
      return false;
    }

    const now = Date.now();
    const lastRefresh = lastRefreshByAddressRef.current.get(address) ?? 0;
    const timeSinceLastRefresh = now - lastRefresh;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
      const secondsRemaining = Math.ceil((MIN_REFRESH_INTERVAL_MS - timeSinceLastRefresh) / 1000);
      const message = `Please wait ${secondsRemaining} second${secondsRemaining > 1 ? 's' : ''} before refreshing again`;
      showToast(message, 'info');
      return false;
    }

    // Only record the cooldown after a successful check. Setting it before the
    // fetch would rate-limit the user for 5s even when the request failed,
    // blocking an immediate retry after a transient blip.
    const summary = await execute(async () => {
      const result = await fetchAddressSummary({
        network,
        address,
        provider: explorerProvider,
        fallbackToOtherProvider: true,
      });
      showToast(`Vault status updated via ${result.providerLabel}`);
      return result;
    });

    if (summary) {
      lastRefreshByAddressRef.current.set(address, Date.now());
      return true;
    }
    return false;
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
