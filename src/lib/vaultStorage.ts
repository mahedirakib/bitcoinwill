import type { PlanInput, PlanOutput } from '@/lib/bitcoin/types';
import {
  validateAndNormalizeRecoveryKit,
  type RecoveryKitData,
} from '@/lib/bitcoin/instructions';

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

/**
 * Removes the social-recovery kit (all Shamir shares) from a PlanOutput before
 * it is persisted. The entire point of splitting the beneficiary key into
 * shares is that no single location holds all of them — storing all shares
 * together in localStorage would defeat that and expose the key to any
 * browser extension, shared-computer user, or XSS that can read localStorage.
 *
 * The in-memory wizard state still keeps the shares (for display/download),
 * but the persisted copy must never contain them.
 */
const stripRecoveryKitSecrets = (result: PlanOutput): PlanOutput => {
  if (!result.social_recovery_kit) return result;
  const { social_recovery_kit: _socialRecoveryKit, ...safeResult } = result;
  return safeResult;
};

export const getSavedVaults = (): SavedVault[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeSavedVault)
      .filter((vault): vault is SavedVault => vault !== null);
  } catch {
    return [];
  }
};

export const saveVault = (plan: PlanInput, result: PlanOutput, name?: string): SavedVault | null => {
  let normalized: RecoveryKitData;
  try {
    normalized = validateAndNormalizeRecoveryKit({ plan, result });
  } catch {
    return null;
  }

  const vault: SavedVault = {
    id: generateVaultId(),
    name: name || `Vault ${normalized.result.address.slice(0, 8)}…`,
    address: normalized.result.address,
    network: normalized.plan.network,
    addressType: normalized.result.address_type,
    createdAt: new Date().toISOString(),
    plan: normalized.plan,
    // Never persist the SSS shares — see stripRecoveryKitSecrets.
    result: stripRecoveryKitSecrets(normalized.result),
  };

  const existing = getSavedVaults();
  const updated = [vault, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage is unavailable (quota exceeded, Safari private mode, restricted
    // context). Return null so callers can surface the failure instead of
    // reporting a false "saved" confirmation.
    return null;
  }
  return vault;
};

export const deleteVault = (id: string): boolean => {
  const existing = getSavedVaults();
  const filtered = existing.filter((v) => v.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
};

export const clearAllVaults = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

export const updateVaultName = (id: string, name: string): boolean => {
  const existing = getSavedVaults();
  const updated = existing.map((v) =>
    v.id === id ? { ...v, name: name.trim() || v.name } : v
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
};

export const updateVaultNotes = (id: string, notes: string): boolean => {
  const existing = getSavedVaults();
  const updated = existing.map((v) =>
    v.id === id ? { ...v, notes: notes.trim() } : v
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
};

export const updateVaultLastChecked = (id: string): boolean => {
  const existing = getSavedVaults();
  const updated = existing.map((v) =>
    v.id === id ? { ...v, lastCheckedAt: new Date().toISOString() } : v
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
};

export const updateVaultTags = (id: string, tags: string[]): boolean => {
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
    return true;
  } catch {
    return false;
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
      const importedVaults: SavedVault[] = [];

      for (const vault of parsed.vaults) {
        if (!isValidVault(vault)) {
          result.errors.push(`Invalid vault data: ${vault?.name || 'unknown'}`);
          continue;
        }
        let normalized: RecoveryKitData;
        try {
          normalized = validateAndNormalizeRecoveryKit({
            plan: vault.plan,
            result: vault.result,
          });
        } catch {
          result.errors.push(`Vault failed integrity check: ${vault.name}`);
          continue;
        }
        if (
          vault.address !== normalized.result.address ||
          vault.network !== normalized.plan.network ||
          vault.addressType !== normalized.result.address_type
        ) {
          result.errors.push(`Vault metadata failed integrity check: ${vault.name}`);
          continue;
        }
        if (existingAddresses.has(normalized.result.address)) {
          result.skipped++;
          continue;
        }
        // Re-strip any shares that may have been present in the backup so the
        // restored vault never carries SSS shares in localStorage.
        const newVault: SavedVault = {
          ...vault,
          id: generateVaultId(),
          plan: normalized.plan,
          result: stripRecoveryKitSecrets(normalized.result),
        };
        existing.push(newVault);
        importedVaults.push(newVault);
        existingAddresses.add(normalized.result.address);
      }

      if (importedVaults.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
          result.imported = importedVaults.length;
        } catch {
          result.errors.push('Failed to save imported vaults to storage');
        }
      }
      return result;
    }

    // Handle single recovery kit format
    if (parsed.plan && parsed.result) {
      let normalized: RecoveryKitData;
      try {
        normalized = validateAndNormalizeRecoveryKit(parsed);
      } catch {
        result.errors.push('Recovery Kit failed integrity check');
        return result;
      }
      const address = normalized.result.address;
      if (address && getVaultByAddress(address)) {
        result.skipped++;
        return result;
      }
      const safeName = typeof parsed.name === 'string' ? parsed.name : undefined;
      const saved = saveVault(normalized.plan, normalized.result, safeName);
      if (saved) {
        result.imported++;
      } else {
        // saveVault returns null when localStorage is unavailable (quota,
        // Safari private mode, restricted context). Don't claim success.
        result.errors.push('Failed to save vault to storage');
      }
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
    typeof v.addressType === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.plan === 'object' &&
    typeof v.result === 'object'
  );
};

const normalizeSavedVault = (vault: unknown): SavedVault | null => {
  if (!isValidVault(vault)) return null;
  try {
    const normalized = validateAndNormalizeRecoveryKit({
      plan: vault.plan,
      result: vault.result,
    });
    if (
      vault.address !== normalized.result.address ||
      vault.network !== normalized.plan.network ||
      vault.addressType !== normalized.result.address_type
    ) {
      return null;
    }
    return {
      ...vault,
      plan: normalized.plan,
      result: stripRecoveryKitSecrets(normalized.result),
    };
  } catch {
    return null;
  }
};
