import { useState, useCallback } from 'react';
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
import type { UseVaultStatusReturn } from '../types';

export const useVaultStatus = (
  network: BitcoinNetwork,
  address: string | undefined
): UseVaultStatusReturn => {
  const { showToast } = useToast();
  const [explorerProvider, setExplorerProvider] = useState<ExplorerProvider>('mempool');
  const [vaultStatus, setVaultStatus] = useState<AddressSummary | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const publicExplorerAvailable = supportsPublicExplorerNetwork(network);

  const refreshVaultStatus = useCallback(async () => {
    if (!address) return;
    
    if (!publicExplorerAvailable) {
      const message = 'Public explorers do not support Regtest. Connect a local node for live status.';
      setStatusError(message);
      showToast(message);
      return;
    }

    setIsCheckingStatus(true);
    setStatusError(null);
    
    try {
      const summary = await fetchAddressSummary({
        network,
        address,
        provider: explorerProvider,
        fallbackToOtherProvider: true,
      });
      setVaultStatus(summary);
      showToast(`Vault status updated via ${summary.providerLabel}`);
    } catch (error) {
      const message = (error as Error).message || 'Could not fetch vault status.';
      setStatusError(message);
      showToast(message);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [address, explorerProvider, network, showToast, publicExplorerAvailable]);

  const clearVaultStatus = useCallback(() => {
    setVaultStatus(null);
    setStatusError(null);
  }, []);

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
