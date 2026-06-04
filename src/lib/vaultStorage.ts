import type { PlanInput, PlanOutput } from '@/lib/bitcoin/types';

export interface SavedVault {
  id: string;
  name: string;
  address: string;
  network: string;
  addressType: string;
  createdAt: string;
  plan: PlanInput;
  result: PlanOutput;
  notes?: string;
  lastCheckedAt?: string;
  tags?: string[];
}

export const VAULTS_STORAGE_KEY = 'bitcoinwill_saved_vaults';
const STORAGE_KEY = VAULTS_STORAGE_KEY;

const generateVaultId = (): string => {
  const timestamp = Date.now().toString(36);
  // Use crypto.randomUUID when available for better collision resistance,
  // falling back to Math.random for environments without crypto.
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
      : Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
};

export const getSavedVaults = (): SavedVault[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidVault);
  } catch {
    return [];
  }
};

export const saveVault = (plan: PlanInput, result: PlanOutput, name?: string): SavedVault => {
  const vault: SavedVault = {
    id: generateVaultId(),
    name: name || `Vault ${result.address.slice(0, 8)}…`,
    address: result.address,
    network: plan.network,
    addressType: result.address_type,
    createdAt: new Date().toISOString(),
    plan,
    result,
  };

  const existing = getSavedVaults();
  const updated = [vault, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors in restricted browser contexts
  }
  return vault;
};

export const deleteVault = (id: string): void => {
  const existing = getSavedVaults();
  const filtered = existing.filter((v) => v.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore storage errors
  }
};

export const clearAllVaults = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const updateVaultName = (id: string, name: string): void => {
  const existing = getSavedVaults();
  const updated = existing.map((v) =>
    v.id === id ? { ...v, name: name.trim() || v.name } : v
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
};

export const updateVaultNotes = (id: string, notes: string): void => {
  const existing = getSavedVaults();
  const updated = existing.map((v) =>
    v.id === id ? { ...v, notes: notes.trim() } : v
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
};

export const updateVaultLastChecked = (id: string): void => {
  const existing = getSavedVaults();
  const updated = existing.map((v) =>
    v.id === id ? { ...v, lastCheckedAt: new Date().toISOString() } : v
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
};

export const updateVaultTags = (id: string, tags: string[]): void => {
  const existing = getSavedVaults();
  const updated = existing.map((v) =>
    v.id === id
      ? {
          ...v,
          tags: tags
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t.length > 0),
        }
      : v
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
};

export const getVaultById = (id: string): SavedVault | undefined => {
  return getSavedVaults().find((v) => v.id === id);
};

export const getVaultByAddress = (address: string): SavedVault | undefined => {
  return getSavedVaults().find((v) => v.address === address);
};

export interface VaultBackup {
  version: string;
  exportedAt: string;
  vaults: SavedVault[];
}

export const exportVaults = (): string => {
  const backup: VaultBackup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    vaults: getSavedVaults(),
  };
  return JSON.stringify(backup, null, 2);
};

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export const importVaultsFromBackup = (json: string): ImportResult => {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  try {
    const parsed = JSON.parse(json);

    // Handle backup format
    if (parsed.vaults && Array.isArray(parsed.vaults)) {
      const existing = getSavedVaults();
      const existingAddresses = new Set(existing.map((v) => v.address));

      for (const vault of parsed.vaults) {
        if (!isValidVault(vault)) {
          result.errors.push(`Invalid vault data: ${vault?.name || 'unknown'}`);
          continue;
        }
        if (existingAddresses.has(vault.address)) {
          result.skipped++;
          continue;
        }
        const newVault: SavedVault = { ...vault, id: generateVaultId() };
        existing.push(newVault);
        existingAddresses.add(vault.address);
        result.imported++;
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      } catch {
        result.errors.push('Failed to save imported vaults to storage');
      }
      return result;
    }

    // Handle single recovery kit format
    if (parsed.plan && parsed.result) {
      const address = parsed.result.address;
      if (address && getVaultByAddress(address)) {
        result.skipped++;
        return result;
      }
      saveVault(parsed.plan, parsed.result, parsed.name);
      result.imported++;
      return result;
    }

    result.errors.push('Unrecognized file format');
  } catch {
    result.errors.push('Invalid JSON');
  }

  return result;
};

const isValidVault = (vault: unknown): vault is SavedVault => {
  if (typeof vault !== 'object' || vault === null) return false;
  const v = vault as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.address === 'string' &&
    typeof v.network === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.plan === 'object' &&
    typeof v.result === 'object'
  );
};
