import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Check, Copy, Shield } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface SSSPrivateKeyModalProps {
  privateKey: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SSSPrivateKeyModal = ({ privateKey, onConfirm, onCancel }: SSSPrivateKeyModalProps) => {
  const { showToast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const timerRef = useRef<number | null>(null);
  const isCopyingRef = useRef(false);

  const modalRef = useFocusTrap<HTMLDivElement>({ onEscape: onCancel });

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (isCopyingRef.current) return;
    isCopyingRef.current = true;
    try {
      if (!navigator.clipboard?.writeText) {
        showToast('Clipboard unavailable in this browser context', 'error');
        return;
      }
      await navigator.clipboard.writeText(privateKey);
      setHasCopied(true);
      showToast('Private key copied to clipboard');
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setHasCopied(false);
        timerRef.current = null;
      }, 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    } finally {
      isCopyingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-foreground/30 p-6">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sss-private-key-title"
        className="panel w-full max-w-xl overflow-hidden shadow-xl"
      >
        <div className="border-b border-border bg-warning-bg px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-warning/10 p-2 text-warning">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 id="sss-private-key-title" className="text-base font-semibold text-foreground">
                Save the beneficiary private key first
              </h2>
              <p className="text-sm text-warning">
                This key will be split into shares. Make a copy before continuing.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex gap-2 rounded-md border border-warning/30 bg-warning-bg p-3 text-xs text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Important</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>This is the <strong className="font-semibold">beneficiary private key</strong> that will be split into shares.</li>
                <li>If you lose all shares and don't have this key, the funds cannot be recovered.</li>
                <li>Store it separately from the shares.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <span className="field-label">Beneficiary private key (hex)</span>
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3">
              <div className="flex-1 break-all font-mono text-xs text-foreground">{privateKey}</div>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy beneficiary private key"
                className="btn-secondary flex-shrink-0 !px-2.5 !py-2"
              >
                {hasCopied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label
            htmlFor="confirm-backup"
            className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/40 p-3"
          >
            <input
              id="confirm-backup"
              type="checkbox"
              checked={hasConfirmed}
              onChange={(e) => setHasConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-foreground"
            />
            <span className="text-sm text-foreground">
              I confirm I have stored this private key. I understand that if I lose all shares and don't have this key, the funds will be unrecoverable.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-4">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!hasConfirmed}
            className="btn-primary"
          >
            Continue to split shares
          </button>
        </div>
      </div>
    </div>
  );
};
