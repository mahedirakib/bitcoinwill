import { useState } from 'react';
import { Shield, AlertTriangle, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface SSSPrivateKeyModalProps {
  privateKey: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SSSPrivateKeyModal = ({ privateKey, onConfirm, onCancel }: SSSPrivateKeyModalProps) => {
  const { showToast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(privateKey).then(() => {
      setHasCopied(true);
      showToast('Private key copied to clipboard');
      setTimeout(() => setHasCopied(false), 2000);
    }).catch(() => {
      showToast('Failed to copy to clipboard');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-background rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95">
        <div className="p-6 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            <div>
              <h2 className="text-xl font-bold text-red-700">Critical Security Step</h2>
              <p className="text-sm text-red-600/80">This private key will be split into shares. Save it now.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-orange-700">
              <p className="font-bold">Important Security Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>This is the <strong>beneficiary private key</strong> that will be split into shares</li>
                <li>If you lose all shares and don't have this key, the funds cannot be recovered</li>
                <li>Store this key in a secure location separate from the shares</li>
                <li>Consider this a &quot;master backup&quot; of the beneficiary access</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-bold">Beneficiary Private Key (hex)</span>
            <div className="relative">
              <div className="p-4 bg-muted rounded-2xl font-mono text-xs break-all border border-border">
                {privateKey}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-background rounded-xl border border-border hover:bg-muted transition-colors"
                title="Copy to clipboard"
              >
                {hasCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
            <input
              type="checkbox"
              id="confirm-backup"
              checked={hasConfirmed}
              onChange={(e) => setHasConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border"
            />
            <label htmlFor="confirm-backup" className="text-sm text-foreground/80 cursor-pointer">
              I confirm that I have written down or securely stored this private key. 
              I understand that if I lose all shares and don't have this key, the funds will be unrecoverable.
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-between items-center bg-muted/30">
          <button
            type="button"
            onClick={onCancel}
            className="text-foreground/60 font-bold hover:text-foreground/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!hasConfirmed}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue to Split Shares
          </button>
        </div>
      </div>
    </div>
  );
};
