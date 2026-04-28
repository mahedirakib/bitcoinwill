import { useState } from 'react';
import { AlertTriangle, ChevronRight, Shield, Wallet } from 'lucide-react';
import {
  SUPPORTED_WALLETS,
  type HardwareWalletType,
} from '@/lib/bitcoin/hardwareWallet';

interface HardwareWalletModalProps {
  onConnect: (type: HardwareWalletType) => Promise<void>;
  onClose: () => void;
}

export const HardwareWalletModal = ({ onConnect, onClose }: HardwareWalletModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (type: HardwareWalletType) => {
    setLoading(true);
    setError(null);
    try {
      await onConnect(type);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-foreground/30 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hw-wallet-title"
        className="panel w-full max-w-md p-6 space-y-5 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 text-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h3 id="hw-wallet-title" className="text-base font-semibold">Connect hardware wallet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your device to fill the public key automatically.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-2">
          {SUPPORTED_WALLETS.filter((w) => w.supported).map((wallet) => (
            <button
              key={wallet.type}
              type="button"
              onClick={() => handleConnect(wallet.type)}
              disabled={loading}
              className="group flex w-full items-center gap-3 rounded-md border border-border bg-white px-3 py-3 text-left transition-colors hover:border-border-strong hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="rounded-md bg-muted p-2 text-foreground/70">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{wallet.label}</div>
                <p className="text-xs text-muted-foreground">{wallet.description}</p>
              </div>
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              )}
            </button>
          ))}
        </div>

        <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 text-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span className="font-semibold">Why use a hardware wallet?</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Private keys never leave the device</li>
            <li>Verify addresses on the device screen</li>
            <li>Protection against malware and keyloggers</li>
          </ul>
        </div>

        <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground">Requirements</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Use Chrome, Edge, or Brave browser</li>
            <li>Connect device via USB cable</li>
            <li>Unlock device and approve the connection</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
