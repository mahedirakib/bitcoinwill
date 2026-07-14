import { useState, useCallback, useEffect } from 'react';
import type { PlanInput, PlanOutput } from '@/lib/bitcoin/types';
import {
  getSavedVaults,
  saveVault,
  deleteVault,
  clearAllVaults,
  updateVaultName,
  updateVaultNotes,
  updateVaultLastChecked,
  updateVaultTags,
  exportVaults,
  importVaultsFromBackup,
  type SavedVault,
  type ImportResult,
} from '@/lib/vaultStorage';
import { VAULTS_STORAGE_KEY } from '@/lib/vaultStorage';

export interface UseVaultsReturn {
  vaults: SavedVault[];
  saveNewVault: (plan: PlanInput, result: PlanOutput, name?: string) => SavedVault | null;
  removeVault: (id: string) => boolean;
  clearAllVaults: () => boolean;
  renameVault: (id: string, name: string) => boolean;
  updateNotes: (id: string, notes: string) => boolean;
  updateTags: (id: string, tags: string[]) => boolean;
  markChecked: (id: string) => boolean;
  hasVault: (address: string) => boolean;
  refreshVaults: () => void;
  exportAllVaults: () => string;
  importVaults: (json: string) => ImportResult;
}

export const useVaults = (): UseVaultsReturn => {
  const [vaults, setVaults] = useState<SavedVault[]>(() => getSavedVaults());

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === VAULTS_STORAGE_KEY) {
        setVaults(getSavedVaults());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const refreshVaults = useCallback(() => {
    setVaults(getSavedVaults());
  }, []);

  const saveNewVault = useCallback(
    (plan: PlanInput, result: PlanOutput, name?: string) => {
      const vault = saveVault(plan, result, name);
      if (vault) refreshVaults();
      return vault;
    },
    [refreshVaults]
  );

  const removeVault = useCallback(
    (id: string) => {
      const deleted = deleteVault(id);
      if (deleted) refreshVaults();
      return deleted;
    },
    [refreshVaults]
  );

  const clearAll = useCallback(() => {
    const cleared = clearAllVaults();
    if (cleared) refreshVaults();
    return cleared;
  }, [refreshVaults]);

  const renameVault = useCallback(
    (id: string, name: string) => {
      const updated = updateVaultName(id, name);
      if (updated) refreshVaults();
      return updated;
    },
    [refreshVaults]
  );

  const updateNotes = useCallback(
    (id: string, notes: string) => {
      const updated = updateVaultNotes(id, notes);
      if (updated) refreshVaults();
      return updated;
    },
    [refreshVaults]
  );

  const updateTags = useCallback(
    (id: string, tags: string[]) => {
      const updated = updateVaultTags(id, tags);
      if (updated) refreshVaults();
      return updated;
    },
    [refreshVaults]
  );

  const markChecked = useCallback(
    (id: string) => {
      const updated = updateVaultLastChecked(id);
      if (updated) refreshVaults();
      return updated;
    },
    [refreshVaults]
  );

  const hasVault = useCallback(
    (address: string) => vaults.some((v) => v.address === address),
    [vaults]
  );

  const exportAllVaults = useCallback(() => {
    return exportVaults();
  }, []);

  const importVaults = useCallback(
    (json: string) => {
      const result = importVaultsFromBackup(json);
      refreshVaults();
      return result;
    },
    [refreshVaults]
  );

  return {
    vaults,
    saveNewVault,
    removeVault,
    clearAllVaults: clearAll,
    renameVault,
    updateNotes,
    updateTags,
    markChecked,
    hasVault,
    refreshVaults,
    exportAllVaults,
    importVaults,
  };
};
