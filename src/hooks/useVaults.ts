import { useState, useCallback, useEffect } from 'react';
import type { PlanInput, PlanOutput } from '@/lib/bitcoin/types';
import {
  getSavedVaults,
  saveVault,
  deleteVault,
  updateVaultName,
  updateVaultNotes,
  updateVaultLastChecked,
  updateVaultTags,
  exportVaults,
  importVaultsFromBackup,
  type SavedVault,
  type ImportResult,
} from '@/lib/vaultStorage';

export interface UseVaultsReturn {
  vaults: SavedVault[];
  saveNewVault: (plan: PlanInput, result: PlanOutput, name?: string) => SavedVault;
  removeVault: (id: string) => void;
  renameVault: (id: string, name: string) => void;
  updateNotes: (id: string, notes: string) => void;
  updateTags: (id: string, tags: string[]) => void;
  markChecked: (id: string) => void;
  hasVault: (address: string) => boolean;
  refreshVaults: () => void;
  exportAllVaults: () => string;
  importVaults: (json: string) => ImportResult;
}

export const useVaults = (): UseVaultsReturn => {
  const [vaults, setVaults] = useState<SavedVault[]>(() => getSavedVaults());

  const refreshVaults = useCallback(() => {
    setVaults(getSavedVaults());
  }, []);

  useEffect(() => {
    refreshVaults();
  }, [refreshVaults]);

  const saveNewVault = useCallback(
    (plan: PlanInput, result: PlanOutput, name?: string) => {
      const vault = saveVault(plan, result, name);
      refreshVaults();
      return vault;
    },
    [refreshVaults]
  );

  const removeVault = useCallback(
    (id: string) => {
      deleteVault(id);
      refreshVaults();
    },
    [refreshVaults]
  );

  const renameVault = useCallback(
    (id: string, name: string) => {
      updateVaultName(id, name);
      refreshVaults();
    },
    [refreshVaults]
  );

  const updateNotes = useCallback(
    (id: string, notes: string) => {
      updateVaultNotes(id, notes);
      refreshVaults();
    },
    [refreshVaults]
  );

  const updateTags = useCallback(
    (id: string, tags: string[]) => {
      updateVaultTags(id, tags);
      refreshVaults();
    },
    [refreshVaults]
  );

  const markChecked = useCallback(
    (id: string) => {
      updateVaultLastChecked(id);
      refreshVaults();
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
