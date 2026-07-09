import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getSavedVaults,
  saveVault,
  deleteVault,
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

const mockPlan: PlanInput = {
  network: 'testnet',
  inheritance_type: 'timelock_recovery',
  owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
  beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
  locktime_blocks: 144,
  address_type: 'p2wsh',
  recovery_method: 'single',
};

const mockResult: PlanOutput = {
  descriptor: 'wsh(raw(abc123))',
  script_asm: 'OP_IF ... OP_ENDIF',
  script_hex: 'abc123',
  address: 'tb1qtestaddress123',
  witness_script: 'abc123',
  network: 'testnet',
  address_type: 'p2wsh',
  human_explanation: ['Test vault'],
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
  });

  describe('deleteVault', () => {
    it('should remove vault by id', () => {
      const vault = saveVault(mockPlan, mockResult)!;
      expect(getSavedVaults()).toHaveLength(1);

      deleteVault(vault.id);
      expect(getSavedVaults()).toHaveLength(0);
    });

    it('should handle deleting non-existent vault gracefully', () => {
      saveVault(mockPlan, mockResult);
      deleteVault('non-existent-id');
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
      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        vaults: [
          {
            id: 'imported-1',
            name: 'Imported Vault',
            address: 'tb1qimported',
            network: 'testnet',
            addressType: 'p2wsh',
            createdAt: new Date().toISOString(),
            plan: mockPlan,
            result: { ...mockResult, address: 'tb1qimported' },
          },
        ],
      };

      const result = importVaultsFromBackup(JSON.stringify(backup));
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(getSavedVaults()).toHaveLength(1);
    });

    it('should skip existing vaults by address', () => {
      saveVault(mockPlan, mockResult);
      const backup = {
        version: '1.0',
        vaults: [
          {
            id: 'imported-1',
            name: 'Imported Vault',
            address: mockResult.address,
            network: 'testnet',
            addressType: 'p2wsh',
            createdAt: new Date().toISOString(),
            plan: mockPlan,
            result: mockResult,
          },
        ],
      };

      const result = importVaultsFromBackup(JSON.stringify(backup));
      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
    });

    it('should import from recovery kit format', () => {
      const kit = {
        plan: mockPlan,
        result: { ...mockResult, address: 'tb1qnewaddress' },
      };

      const result = importVaultsFromBackup(JSON.stringify(kit));
      expect(result.imported).toBe(1);
      expect(getSavedVaults()).toHaveLength(1);
    });

    it('reports a storage failure for single-kit import instead of claiming success', () => {
      const kit = {
        plan: mockPlan,
        result: { ...mockResult, address: 'tb1qfailwrite' },
      };

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
      const backup = {
        version: '1.0',
        vaults: [
          {
            id: 'imported-1',
            name: 'Imported Vault',
            address: 'tb1qfailbackupwrite',
            network: 'testnet',
            addressType: 'p2wsh',
            createdAt: new Date().toISOString(),
            plan: mockPlan,
            result: { ...mockResult, address: 'tb1qfailbackupwrite' },
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
      const kit = {
        plan: mockPlan,
        result: { ...mockResult, address: 'tb1qbadname' },
        name: { weird: true },
      };

      const result = importVaultsFromBackup(JSON.stringify(kit));
      expect(result.imported).toBe(1);

      const saved = getSavedVaults();
      expect(saved).toHaveLength(1);
      // A non-string name must not be persisted; fall back to the default.
      expect(typeof saved[0].name).toBe('string');
      expect(saved[0].name).toBe(`Vault ${'tb1qbadname'.slice(0, 8)}…`);
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

    it('strips social_recovery_kit shares when importing a backup', () => {
      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        vaults: [
          {
            id: 'imported-with-shares',
            name: 'Imported Vault',
            address: 'tb1qwithshares',
            network: 'testnet',
            addressType: 'p2wsh',
            createdAt: new Date().toISOString(),
            plan: mockPlan,
            result: {
              ...mockResult,
              address: 'tb1qwithshares',
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
