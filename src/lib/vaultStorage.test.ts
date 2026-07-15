import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSavedVaults,
  saveVault,
  deleteVault,
  clearAllVaults,
  updateVaultName,
  updateVaultNotes,
  updateVaultLastChecked,
  updateVaultTags,
  getVaultById,
  getVaultByAddress,
  exportVaults,
  importVaultsFromBackup,
} from './vaultStorage';
import type { PlanInput, PlanOutput } from './bitcoin/types';
import { buildPlan } from './bitcoin/planEngine';

const mockPlan: PlanInput = {
  network: 'testnet',
  inheritance_type: 'timelock_recovery',
  owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
  beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
  locktime_blocks: 144,
  address_type: 'p2wsh',
  recovery_method: 'single',
};

const mockResult: PlanOutput = buildPlan(mockPlan);

const createCanonicalKit = (locktimeBlocks: number) => {
  const plan: PlanInput = {
    ...mockPlan,
    locktime_blocks: locktimeBlocks,
  };
  return { plan, result: buildPlan(plan) };
};

const createMockStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

describe('vaultStorage', () => {
  const mockStorage = createMockStorage();

  beforeEach(() => {
    mockStorage.clear();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getSavedVaults', () => {
    it('should return empty array when no vaults stored', () => {
      expect(getSavedVaults()).toEqual([]);
    });

    it('should return empty array when localStorage has invalid data', () => {
      localStorage.setItem('bitcoinwill_saved_vaults', 'invalid json');
      expect(getSavedVaults()).toEqual([]);
    });

    it('should return empty array when stored data is not an array', () => {
      localStorage.setItem('bitcoinwill_saved_vaults', JSON.stringify({ foo: 'bar' }));
      expect(getSavedVaults()).toEqual([]);
    });

    it('should filter out invalid vault objects', () => {
      const invalidVaults = [
        { id: '1', name: 'Valid' }, // Missing required fields
        null,
        'string',
      ];
      localStorage.setItem('bitcoinwill_saved_vaults', JSON.stringify(invalidVaults));
      expect(getSavedVaults()).toEqual([]);
    });

    it('filters out stored vaults whose metadata does not match the plan', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      localStorage.setItem('bitcoinwill_saved_vaults', JSON.stringify([
        { ...vault, network: 'mainnet' },
      ]));

      expect(getSavedVaults()).toEqual([]);
    });

    it('normalizes legacy descriptors in stored vaults', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      const legacyVault = {
        ...vault,
        result: {
          ...vault.result,
          descriptor: `wsh(raw(${vault.result.script_hex}))`,
        },
      };
      localStorage.setItem('bitcoinwill_saved_vaults', JSON.stringify([legacyVault]));

      const restored = getSavedVaults();
      expect(restored).toHaveLength(1);
      expect(restored[0].result.descriptor).toBe(mockResult.descriptor);
    });
  });

  describe('saveVault', () => {
    it('should save a vault and return it with generated id', () => {
      const vault = saveVault(mockPlan, mockResult);

      expect(vault).not.toBeNull();
      expect(vault!.id).toBeDefined();
      expect(vault!.name).toBe(`Vault ${mockResult.address.slice(0, 8)}…`);
      expect(vault!.address).toBe(mockResult.address);
      expect(vault!.network).toBe(mockPlan.network);
      expect(vault!.plan).toEqual(mockPlan);
      expect(vault!.result).toEqual(mockResult);
      expect(vault!.createdAt).toBeDefined();
    });

    it('should use custom name when provided', () => {
      const vault = saveVault(mockPlan, mockResult, 'My Custom Vault');
      expect(vault!.name).toBe('My Custom Vault');
    });

    it('should prepend new vault to existing vaults', () => {
      saveVault(mockPlan, mockResult, 'First');
      saveVault(mockPlan, mockResult, 'Second');

      const saved = getSavedVaults();
      expect(saved).toHaveLength(2);
      expect(saved[0].name).toBe('Second');
      expect(saved[1].name).toBe('First');
    });

    it('should strip social_recovery_kit shares before persisting', () => {
      const resultWithShares: PlanOutput = {
        ...mockResult,
        social_recovery_kit: {
          config: { threshold: 2, total: 3 },
          shares: [
            { index: 1, share: 'a'.repeat(80) },
            { index: 2, share: 'b'.repeat(80) },
          ],
          instructions: ['Keep shares separate.'],
        },
      };

      const vault = saveVault(mockPlan, resultWithShares);

      expect(vault).not.toBeNull();
      // The returned vault reflects exactly what was persisted (shares stripped),
      // so callers can't accidentally treat the saved vault as still carrying
      // the share material. The in-memory wizard state keeps its own copy.
      expect(vault!.result.social_recovery_kit).toBeUndefined();

      // The persisted copy must NOT contain the shares either.
      const stored = getSavedVaults();
      expect(stored).toHaveLength(1);
      expect(stored[0].result.social_recovery_kit).toBeUndefined();
    });

    it('should return null when localStorage.setItem throws', () => {
      // Override setItem to throw, simulating quota exceeded / private mode.
      mockStorage.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      const vault = saveVault(mockPlan, mockResult);
      expect(vault).toBeNull();
    });

    it('rejects a result that does not match the plan', () => {
      const tamperedResult = { ...mockResult, address: 'tb1qtampered' };

      expect(saveVault(mockPlan, tamperedResult)).toBeNull();
      expect(getSavedVaults()).toHaveLength(0);
    });
  });

  describe('deleteVault', () => {
    it('should remove vault by id', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      expect(getSavedVaults()).toHaveLength(1);

      expect(deleteVault(vault.id)).toBe(true);
      expect(getSavedVaults()).toHaveLength(0);
    });

    it('should handle deleting non-existent vault gracefully', () => {
      saveVault(mockPlan, mockResult);
      deleteVault('non-existent-id');
      expect(getSavedVaults()).toHaveLength(1);
    });

    it('reports when the vault could not be removed from storage', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      mockStorage.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      expect(deleteVault(vault.id)).toBe(false);
      expect(getSavedVaults()).toHaveLength(1);
    });
  });

  describe('updateVaultName', () => {
    it('should update vault name', () => {
      const vault = saveVault(mockPlan, mockResult, 'Original')!;
      updateVaultName(vault.id, 'Updated');

      const saved = getSavedVaults();
      expect(saved[0].name).toBe('Updated');
    });

    it('should keep original name if new name is empty', () => {
      const vault = saveVault(mockPlan, mockResult, 'Original')!;
      updateVaultName(vault.id, '   ');

      const saved = getSavedVaults();
      expect(saved[0].name).toBe('Original');
    });

    it('reports a storage failure without changing the vault name', () => {
      const vault = saveVault(mockPlan, mockResult, 'Original')!;
      mockStorage.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      expect(updateVaultName(vault.id, 'Updated')).toBe(false);
      expect(getSavedVaults()[0].name).toBe('Original');
    });
  });

  describe('clearAllVaults', () => {
    it('reports when storage cannot be cleared', () => {
      saveVault(mockPlan, mockResult);
      mockStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('SecurityError');
      });

      expect(clearAllVaults()).toBe(false);
      expect(getSavedVaults()).toHaveLength(1);
    });
  });

  describe('updateVaultNotes', () => {
    it('should update vault notes', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      updateVaultNotes(vault.id, 'Test note content');

      const saved = getSavedVaults();
      expect(saved[0].notes).toBe('Test note content');
    });

    it('should trim notes', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      updateVaultNotes(vault.id, '  trimmed notes  ');

      const saved = getSavedVaults();
      expect(saved[0].notes).toBe('trimmed notes');
    });
  });

  describe('updateVaultLastChecked', () => {
    it('should update last checked timestamp', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      expect(getSavedVaults()[0].lastCheckedAt).toBeUndefined();

      updateVaultLastChecked(vault.id);

      const saved = getSavedVaults();
      expect(saved[0].lastCheckedAt).toBeDefined();
      expect(new Date(saved[0].lastCheckedAt!).getTime()).toBeGreaterThan(0);
    });
  });

  describe('getVaultById', () => {
    it('should return vault by id', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      const found = getVaultById(vault.id);
      expect(found).toEqual(vault);
    });

    it('should return undefined for non-existent id', () => {
      const found = getVaultById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('getVaultByAddress', () => {
    it('should return vault by address', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      const found = getVaultByAddress(mockResult.address);
      expect(found).toEqual(vault);
    });

    it('should return undefined for non-existent address', () => {
      const found = getVaultByAddress('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('exportVaults', () => {
    it('should export all vaults as JSON', () => {
      saveVault(mockPlan, mockResult, 'Vault 1');
      const exported = exportVaults();
      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe('1.0');
      expect(parsed.vaults).toHaveLength(1);
      expect(parsed.vaults[0].name).toBe('Vault 1');
    });
  });

  describe('updateVaultTags', () => {
    it('should update vault tags', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      updateVaultTags(vault.id, ['savings', 'family', '2025']);

      const saved = getSavedVaults();
      expect(saved[0].tags).toEqual(['savings', 'family', '2025']);
    });

    it('should trim and lowercase tags', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      updateVaultTags(vault.id, ['  Savings  ', 'FAMILY', '  2025  ']);

      const saved = getSavedVaults();
      expect(saved[0].tags).toEqual(['savings', 'family', '2025']);
    });

    it('should filter out empty tags', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      updateVaultTags(vault.id, ['savings', '', '  ', 'family']);

      const saved = getSavedVaults();
      expect(saved[0].tags).toEqual(['savings', 'family']);
    });

    it('should clear tags when empty array provided', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      updateVaultTags(vault.id, ['savings']);
      updateVaultTags(vault.id, []);

      const saved = getSavedVaults();
      expect(saved[0].tags).toEqual([]);
    });
  });

  describe('importVaultsFromBackup', () => {
    it('should import vaults from backup', () => {
      const kit = createCanonicalKit(145);
      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        vaults: [
          {
            id: 'imported-1',
            name: 'Imported Vault',
            address: kit.result.address,
            network: 'testnet',
            addressType: 'p2wsh',
            createdAt: new Date().toISOString(),
            plan: kit.plan,
            result: kit.result,
          },
        ],
      };

      const result = importVaultsFromBackup(JSON.stringify(backup));
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(getSavedVaults()).toHaveLength(1);
    });

    it('should skip existing vaults by address', () => {
      const kit = createCanonicalKit(146);
      saveVault(kit.plan, kit.result);
      const backup = {
        version: '1.0',
        vaults: [
          {
            id: 'imported-1',
            name: 'Imported Vault',
            address: kit.result.address,
            network: 'testnet',
            addressType: 'p2wsh',
            createdAt: new Date().toISOString(),
            plan: kit.plan,
            result: kit.result,
          },
        ],
      };

      const result = importVaultsFromBackup(JSON.stringify(backup));
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should import from recovery kit format', () => {
      const kit = createCanonicalKit(147);

      const result = importVaultsFromBackup(JSON.stringify(kit));
      expect(result.imported).toBe(1);
      expect(getSavedVaults()).toHaveLength(1);
    });

    it('reports a storage failure for single-kit import instead of claiming success', () => {
      const kit = createCanonicalKit(148);

      // saveVault's write throws (quota / private mode). The importer must not
      // report the kit as imported when nothing was persisted.
      mockStorage.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      const result = importVaultsFromBackup(JSON.stringify(kit));
      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(getSavedVaults()).toHaveLength(0);
    });

    it('reports a storage failure for backup imports instead of claiming success', () => {
      const kit = createCanonicalKit(149);
      const backup = {
        version: '1.0',
        vaults: [
          {
            id: 'imported-1',
            name: 'Imported Vault',
            address: kit.result.address,
            network: 'testnet',
            addressType: 'p2wsh',
            createdAt: new Date().toISOString(),
            plan: kit.plan,
            result: kit.result,
          },
        ],
      };

      mockStorage.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      const result = importVaultsFromBackup(JSON.stringify(backup));
      expect(result.imported).toBe(0);
      expect(result.errors).toEqual(['Failed to save imported vaults to storage']);
      expect(getSavedVaults()).toHaveLength(0);
    });

    it('ignores a non-string name when importing a single recovery kit', () => {
      const canonical = createCanonicalKit(150);
      const kit = {
        plan: canonical.plan,
        result: canonical.result,
        name: { weird: true },
      };

      const result = importVaultsFromBackup(JSON.stringify(kit));
      expect(result.imported).toBe(1);

      const saved = getSavedVaults();
      expect(saved).toHaveLength(1);
      // A non-string name must not be persisted; fall back to the default.
      expect(typeof saved[0].name).toBe('string');
      expect(saved[0].name).toBe(`Vault ${canonical.result.address.slice(0, 8)}…`);
    });

    it('rejects a single recovery kit whose result does not match its plan', () => {
      const kit = createCanonicalKit(152);
      const tampered = {
        ...kit,
        result: { ...kit.result, address: 'tb1qtampered' },
      };

      const result = importVaultsFromBackup(JSON.stringify(tampered));

      expect(result.imported).toBe(0);
      expect(result.errors).toEqual(['Recovery Kit failed integrity check']);
      expect(getSavedVaults()).toHaveLength(0);
    });

    it('rejects backup metadata that disagrees with the canonical plan', () => {
      const kit = createCanonicalKit(153);
      const backup = {
        version: '1.0',
        vaults: [{
          id: 'tampered-metadata',
          name: 'Tampered Vault',
          address: kit.result.address,
          network: 'mainnet',
          addressType: kit.result.address_type,
          createdAt: new Date().toISOString(),
          plan: kit.plan,
          result: kit.result,
        }],
      };

      const result = importVaultsFromBackup(JSON.stringify(backup));

      expect(result.imported).toBe(0);
      expect(result.errors).toEqual(['Vault metadata failed integrity check: Tampered Vault']);
      expect(getSavedVaults()).toHaveLength(0);
    });

    it('should handle invalid JSON', () => {
      const result = importVaultsFromBackup('invalid json');
      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle unrecognized format', () => {
      const result = importVaultsFromBackup(JSON.stringify({ foo: 'bar' }));
      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(1);
    });

    it('rejects backup metadata that cannot be rendered safely', () => {
      const kit = createCanonicalKit(151);
      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        vaults: [{
          id: 'unsafe-metadata',
          name: 'Unsafe metadata',
          address: kit.result.address,
          network: kit.plan.network,
          addressType: kit.result.address_type,
          createdAt: new Date().toISOString(),
          plan: kit.plan,
          result: kit.result,
          notes: { text: 'not a renderable string' },
          tags: 'not-an-array',
        }],
      };

      const result = importVaultsFromBackup(JSON.stringify(backup));

      expect(result.imported).toBe(0);
      expect(result.errors).toEqual(['Invalid vault data: Unsafe metadata']);
      expect(getSavedVaults()).toHaveLength(0);
    });

    it('strips social_recovery_kit shares when importing a backup', () => {
      const kit = createCanonicalKit(151);
      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        vaults: [
          {
            id: 'imported-with-shares',
            name: 'Imported Vault',
            address: kit.result.address,
            network: 'testnet',
            addressType: 'p2wsh',
            createdAt: new Date().toISOString(),
            plan: kit.plan,
            result: {
              ...kit.result,
              social_recovery_kit: {
                config: { threshold: 2, total: 3 },
                shares: [{ index: 1, share: 'a'.repeat(80) }],
                instructions: ['Should not survive import.'],
              },
            },
          },
        ],
      };

      const result = importVaultsFromBackup(JSON.stringify(backup));
      expect(result.imported).toBe(1);

      const stored = getSavedVaults();
      expect(stored).toHaveLength(1);
      expect(stored[0].result.social_recovery_kit).toBeUndefined();
    });
  });
});
