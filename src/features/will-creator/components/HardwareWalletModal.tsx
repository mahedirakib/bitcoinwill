import { useState } from 'react';
import { AlertTriangle, ChevronRight, HelpCircle, Shield, Wallet } from 'lucide-react';
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-background/85 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass max-w-md w-full p-8 space-y-6 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight">Connect Hardware Wallet</h3>
            <p className="text-sm text-foreground/70">
              Select your device to automatically fill the public key.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {SUPPORTED_WALLETS.filter(w => w.supported).map((wallet) => (
            <button
              key={wallet.type}
              type="button"
              onClick={() => handleConnect(wallet.type)}
              disabled={loading}
              className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/30 transition-all text-left disabled:opacity-50 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <Wallet className="w-5 h-5 text-foreground/60 group-hover:text-primary" />
                </div>
                <div className="flex-1">
                  <span className="font-bold block">{wallet.label}</span>
                  <p className="text-xs text-foreground/60">{wallet.description}</p>
                </div>
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-foreground/30 group-hover:text-primary transition-colors" />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 text-xs space-y-2">
          <div className="flex items-center gap-2 text-green-600 font-bold">
            <Shield className="w-4 h-4" />
            <span>Why use a hardware wallet?</span>
          </div>
          <ul className="space-y-1 text-foreground/60 list-disc list-inside pl-1">
            <li>Private keys never leave the device</li>
            <li>Verify addresses on the device screen</li>
            <li>Protection against malware and keyloggers</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 text-xs text-foreground/60 space-y-2">
          <p className="font-bold flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Requirements
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Use Chrome, Edge, or Brave browser</li>
            <li>Connect device via USB cable</li>
            <li>Unlock device and approve the connection</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
