import { useState } from 'react';
import { Shield, Users, Lock, Unlock, AlertTriangle, ChevronRight, Trash2, Key } from 'lucide-react';
import { combineShares } from '@/lib/bitcoin/sss';
import { useToast } from '@/components/Toast';

interface ShareRecoveryProps {
  onKeyReconstructed: (privateKeyHex: string) => void;
  onCancel: () => void;
}

export const ShareRecovery = ({ onKeyReconstructed, onCancel }: ShareRecoveryProps) => {
  const { showToast } = useToast();
  const [shares, setShares] = useState<string[]>(['', '']);
  const [threshold, setThreshold] = useState<2 | 3>(2);
  const [isCombining, setIsCombining] = useState(false);
  const [reconstructedKey, setReconstructedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const updateShare = (index: number, value: string) => {
    const trimmed = value.trim();
    setShares(prev => {
      const next = [...prev];
      next[index] = trimmed;
      return next;
    });
  };

  const addShareInput = () => {
    if (shares.length < 5) {
      setShares(prev => [...prev, '']);
    }
  };

  const removeShareInput = (index: number) => {
    if (shares.length > 2) {
      setShares(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validShares = shares.filter(s => s.length >= 64);
  const canCombine = validShares.length >= threshold;

  const handleCombine = async () => {
    if (!canCombine) {
      showToast(`Need at least ${threshold} valid shares`);
      return;
    }

    setIsCombining(true);
    try {
      const key = await combineShares(validShares.slice(0, threshold));
      setReconstructedKey(key);
      showToast('Private key reconstructed successfully');
    } catch (error) {
      showToast((error as Error).message || 'Failed to combine shares');
    } finally {
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
      <div className="max-w-2xl mx-auto py-12 px-6 space-y-8 animate-in fade-in zoom-in-95">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full" />
            <Unlock className="w-16 h-16 text-green-500 relative" />
          </div>
          <h2 className="text-3xl font-bold">Key Reconstructed</h2>
          <p className="text-foreground/60">
            Your private key has been recovered from the shares. Store it securely.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold">Security Warning</span>
          </div>
          <p className="text-sm text-red-600/80">
            This is your beneficiary private key. Anyone with this key can claim the funds. 
            Write it down or save it to a password manager before continuing.
          </p>

          <div className="space-y-3">
            <span className="text-sm font-bold text-foreground/70">Private Key (hex)</span>
            <div className="relative">
              <div 
                className="p-4 bg-muted rounded-xl font-mono text-xs break-all border border-border"
                style={{ filter: showKey ? 'none' : 'blur(8px)' }}
              >
                {reconstructedKey}
              </div>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute top-2 right-2 px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors"
              >
                {showKey ? 'Hide' : 'Reveal'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-border font-bold hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Continue to Claim
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 space-y-8 animate-in fade-in slide-in-from-bottom-8">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full" />
          <Users className="w-16 h-16 text-orange-500 relative" />
        </div>
        <h2 className="text-3xl font-bold">Social Recovery</h2>
        <p className="text-foreground/60">
          Combine your shares to reconstruct the beneficiary private key.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 space-y-4">
        <div className="flex items-center gap-2 text-orange-700">
          <Shield className="w-5 h-5" />
          <span className="font-bold">How it works</span>
        </div>
        <p className="text-sm text-orange-600/80">
          Enter your shares below. You need enough shares to meet the threshold 
          (e.g., 2 shares for a 2-of-3 setup). The private key is reconstructed locally 
          in your browser — shares are never sent to any server.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-bold">Share Configuration</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setThreshold(2)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                threshold === 2 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              2-of-3
            </button>
            <button
              type="button"
              onClick={() => setThreshold(3)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                threshold === 3 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              3-of-5
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {shares.map((share, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Key className="w-4 h-4 text-foreground/30" />
                  <span className="text-xs font-bold text-foreground/40">Share {index + 1}</span>
                </div>
                <input
                  type="text"
                  value={share}
                  onChange={(e) => updateShare(index, e.target.value)}
                  placeholder="Paste share hex..."
                  className="w-full pl-20 pr-4 py-3 bg-muted border border-border rounded-xl font-mono text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
              {shares.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeShareInput(index)}
                  className="p-3 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {shares.length < 5 && (
          <button
            type="button"
            onClick={addShareInput}
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-bold text-foreground/60 hover:border-orange-500/50 hover:text-orange-600 transition-colors"
          >
            + Add Another Share Input
          </button>
        )}

        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${canCombine ? 'bg-green-500' : 'bg-foreground/20'}`} />
          <span className={canCombine ? 'text-green-600' : 'text-foreground/50'}>
            {validShares.length} of {threshold} required shares entered
          </span>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl border border-border font-bold hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCombine}
          disabled={!canCombine || isCombining}
          className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCombining ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Combining...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Reconstruct Key
            </>
          )}
        </button>
      </div>
    </div>
  );
};
