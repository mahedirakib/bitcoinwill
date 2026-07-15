import { useState, useRef, useCallback } from 'react';
import { AlertTriangle, ChevronRight, Key, Lock, Trash2, Unlock, Users } from 'lucide-react';
import { collectUniqueValidShares, combineShares } from '@/lib/bitcoin/sss';
import { useToast } from '@/components/Toast';

interface ShareInput {
  id: number;
  value: string;
}

interface ShareRecoveryProps {
  onKeyReconstructed: (privateKeyHex: string) => void;
  onCancel: () => void;
  beneficiaryPubkey: string;
  threshold: 2 | 3;
  totalShares: 3 | 5;
}

export const ShareRecovery = ({
  onKeyReconstructed,
  onCancel,
  beneficiaryPubkey,
  threshold,
  totalShares,
}: ShareRecoveryProps) => {
  const { showToast } = useToast();
  const idCounterRef = useRef(0);
  const [shareInputs, setShareInputs] = useState<ShareInput[]>(() => [
    { id: idCounterRef.current++, value: '' },
    { id: idCounterRef.current++, value: '' },
  ]);
  const [isCombining, setIsCombining] = useState(false);
  const [reconstructedKey, setReconstructedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const isCombiningRef = useRef(false);

  const shares = shareInputs.map((input) => input.value);

  const updateShare = useCallback((id: number, value: string) => {
    const trimmed = value.trim();
    setShareInputs((prev) =>
      prev.map((input) => (input.id === id ? { ...input, value: trimmed } : input))
    );
  }, []);

  const addShareInput = useCallback(() => {
    setShareInputs((prev) => {
      if (prev.length >= totalShares) return prev;
      return [...prev, { id: idCounterRef.current++, value: '' }];
    });
  }, [totalShares]);

  const removeShareInput = useCallback((id: number) => {
    setShareInputs((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((input) => input.id !== id);
    });
  }, []);

  const recoverableShares = collectUniqueValidShares(shares);
  const canCombine = recoverableShares.length >= threshold;

  const handleCombine = async () => {
    if (!canCombine || isCombiningRef.current) {
      if (!canCombine) showToast(`Need at least ${threshold} valid shares`, 'info');
      return;
    }

    isCombiningRef.current = true;
    setIsCombining(true);
    try {
      const key = await combineShares(recoverableShares, {
        expectedThreshold: threshold,
        expectedBeneficiaryPubkey: beneficiaryPubkey,
      });
      setReconstructedKey(key);
      showToast('Private key reconstructed successfully');
    } catch (error) {
      showToast((error as Error).message || 'Failed to combine shares', 'error');
    } finally {
      isCombiningRef.current = false;
      setIsCombining(false);
    }
  };

  const handleConfirm = () => {
    if (reconstructedKey) {
      onKeyReconstructed(reconstructedKey);
    }
  };

  if (reconstructedKey) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success-bg px-3 py-2.5">
          <Unlock className="h-4 w-4 text-success" />
          <p className="text-sm font-medium text-success">Key reconstructed.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold tracking-tight">Private key recovered</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Store it securely — anyone with this key can claim the funds.
          </p>
        </div>

        <div className="rounded-md border border-danger/20 bg-danger/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-danger">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">Security warning</span>
          </div>
          <p className="text-sm text-danger/80">
            This is your beneficiary private key. Write it down or save it to a password manager before continuing.
          </p>

          <div className="space-y-1.5">
            <span className="field-label">Private key (hex)</span>
            <div className="relative">
              <div
                className="break-all rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-foreground"
                aria-live={showKey ? 'polite' : undefined}
              >
                {showKey ? reconstructedKey : 'Hidden until revealed'}
              </div>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? 'Hide private key' : 'Reveal private key'}
                aria-pressed={showKey}
                className="absolute right-2 top-2 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                {showKey ? 'Hide' : 'Reveal'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-2 border-t border-border pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="button" onClick={handleConfirm} className="btn-primary">
            Continue to claim <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="section-eyebrow flex items-center gap-1.5">
          <Users className="h-3 w-3" /> Social recovery
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Combine shares</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your shares to reconstruct the beneficiary private key. Reconstruction happens locally — shares are never sent anywhere.
        </p>
      </div>

      <div className="rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          You need enough shares to meet the threshold (e.g., 2 shares for a 2-of-3 setup). The private key is reconstructed locally in your browser.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-white p-3">
        <span className="text-sm font-semibold">Share configuration</span>
        <span className="rounded-md border border-foreground bg-foreground px-3 py-1.5 text-xs font-medium text-white">
          {threshold}-of-{totalShares}
        </span>
      </div>

      <div className="space-y-2">
        {shareInputs.map((input, index) => (
          <div key={input.id} className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Share {index + 1}</span>
              </div>
              <input
                type="text"
                value={input.value}
                onChange={(e) => updateShare(input.id, e.target.value)}
                placeholder="Paste share hex…"
                aria-label={`Share ${index + 1}`}
                autoComplete="off"
                spellCheck={false}
                className="field-input pl-[5.5rem]"
              />
            </div>
            {shareInputs.length > 2 && (
              <button
                type="button"
                onClick={() => removeShareInput(input.id)}
                aria-label={`Remove share ${index + 1}`}
                className="rounded-md border border-border bg-white px-2.5 text-muted-foreground transition-colors hover:border-danger/30 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {shareInputs.length < totalShares && (
        <button
          type="button"
          onClick={addShareInput}
          className="w-full rounded-md border border-dashed border-border-strong bg-muted/40 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          + Add another share input
        </button>
      )}

      <div className="flex items-center gap-2 text-sm">
        <div className={`h-1.5 w-1.5 rounded-full ${canCombine ? 'bg-success' : 'bg-muted-foreground'}`} />
        <span className={canCombine ? 'text-success' : 'text-muted-foreground'}>
          {recoverableShares.length} of {threshold} required unique shares entered
        </span>
      </div>

      <div className="flex justify-between gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button
          type="button"
          onClick={handleCombine}
          disabled={!canCombine || isCombining}
          className="btn-primary"
        >
          {isCombining ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Combining…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" /> Reconstruct key
            </>
          )}
        </button>
      </div>
    </div>
  );
};
