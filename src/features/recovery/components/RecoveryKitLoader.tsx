import { useState } from 'react';
import { ChevronLeft, FileText, Key, Users, Database } from 'lucide-react';
import {
  buildInstructions,
  validateAndNormalizeRecoveryKit,
} from '@/lib/bitcoin/instructions';
import { useToast } from '@/components/Toast';
import { useVaults } from '@/hooks/useVaults';
import type { SavedVault } from '@/lib/vaultStorage';
import type { RecoveryKitLoaderProps } from '../types';

interface ExtendedRecoveryKitLoaderProps extends RecoveryKitLoaderProps {
  onSocialRecovery?: () => void;
}

const SavedVaultCard = ({
  vault,
  onClick,
}: {
  vault: SavedVault;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-md border border-border bg-white p-3 text-left transition-colors hover:border-border-strong hover:bg-muted/30"
  >
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted">
      <Database className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{vault.name}</p>
      <p className="truncate text-xs text-muted-foreground">
        <span className="capitalize">{vault.network}</span> · {vault.address.slice(0, 12)}…{vault.address.slice(-8)}
      </p>
    </div>
  </button>
);

export const RecoveryKitLoader = ({
  onLoad,
  onBack,
  onSocialRecovery,
}: ExtendedRecoveryKitLoaderProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const { showToast } = useToast();
  const { vaults } = useVaults();

  const loadRecoveryKit = (serializedKit: string) => {
    try {
      const parsed = JSON.parse(serializedKit);
      const normalized = validateAndNormalizeRecoveryKit(parsed);
      const model = buildInstructions(normalized.plan, normalized.result, normalized.created_at);
      onLoad(model);
      showToast('Instructions loaded successfully');
    } catch (error) {
      showToast((error as Error).message || 'Error parsing JSON', 'error');
    }
  };

  const handleJsonUpload = () => {
    loadRecoveryKit(jsonInput);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Recovery kits are tiny JSON files. Reject anything oversized to avoid
    // locking up the tab reading a multi-GB file into memory.
    const MAX_KIT_BYTES = 1_000_000; // 1 MB
    if (selectedFile.size > MAX_KIT_BYTES) {
      showToast('File is too large to be a Recovery Kit (max 1 MB).', 'error');
      event.target.value = '';
      return;
    }

    try {
      const fileContents = await selectedFile.text();
      setJsonInput(fileContents);
      loadRecoveryKit(fileContents);
    } catch (error) {
      showToast((error as Error).message || 'Error reading Recovery Kit file', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const handleLoadSavedVault = (vault: SavedVault) => {
    try {
      const model = buildInstructions(vault.plan, vault.result, vault.createdAt);
      onLoad(model);
      showToast(`Loaded ${vault.name}`);
    } catch (error) {
      showToast((error as Error).message || 'Error loading vault', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-1">
        <div className="section-eyebrow flex items-center gap-1.5">
          <FileText className="h-3 w-3" /> Recovery
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Recovery options</h1>
        <p className="text-sm text-muted-foreground">Choose how you want to access the vault.</p>
      </div>

      {vaults.length > 0 && (
        <div className="panel space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 text-foreground/70">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">My saved vaults</h3>
              <p className="text-xs text-muted-foreground">
                Quick access to vaults saved on this device.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {vaults.slice(0, 5).map((vault) => (
              <SavedVaultCard
                key={vault.id}
                vault={vault}
                onClick={() => handleLoadSavedVault(vault)}
              />
            ))}
            {vaults.length > 5 && (
              <p className="text-center text-xs text-muted-foreground">
                +{vaults.length - 5} more vaults available in My vaults
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="panel space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 text-foreground/70">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">I have the recovery kit</h3>
              <p className="text-xs text-muted-foreground">
                Paste the JSON, or choose the exported recovery kit file.
              </p>
            </div>
          </div>

          <label
            htmlFor="recovery-kit-file"
            className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border-strong bg-muted/40 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Choose recovery kit file
            <input
              id="recovery-kit-file"
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleFileSelect}
            />
          </label>

          <p className="text-center section-eyebrow">or paste it below</p>

          <label htmlFor="recovery-kit-json" className="sr-only">
            Recovery kit JSON
          </label>
          <textarea
            id="recovery-kit-json"
            className="field-input h-32 resize-none"
            placeholder='{"version": "0.1.0", "plan": {...}, "result": {...}}'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <button
            type="button"
            onClick={handleJsonUpload}
            disabled={!jsonInput.trim()}
            className="btn-primary w-full"
          >
            Load instructions
          </button>
        </div>

        {onSocialRecovery && (
          <div className="panel space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2 text-foreground/70">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">I have social recovery shares</h3>
                <p className="text-xs text-muted-foreground">
                  Combine shares to reconstruct the private key.
                </p>
              </div>
            </div>

            <button type="button" onClick={onSocialRecovery} className="btn-secondary w-full">
              Start share recovery
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
