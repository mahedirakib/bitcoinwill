import { useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  Download,
  AlertTriangle,
  Shield,
  Info,
  Database,
} from 'lucide-react';
import { useSettings } from '@/state/settings';
import { useVaults } from '@/hooks/useVaults';
import { useToast } from '@/components/Toast';
import { downloadJson } from '@/lib/utils/download';
import type { NavView } from '@/components/AppShell';

interface SettingsPageProps {
  onNavigate: (view: NavView) => void;
}

export const SettingsPage = ({ onNavigate }: SettingsPageProps) => {
  const { network, setNetwork, isMainnetUnlocked, unlockMainnet } = useSettings();
  const { vaults, exportAllVaults, removeVault } = useVaults();
  const { showToast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMainnetConfirm, setShowMainnetConfirm] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState('');

  const handleExport = () => {
    const json = exportAllVaults();
    downloadJson('bitcoin-will-vaults-backup.json', JSON.parse(json));
    showToast('Vaults exported');
  };

  const handleClearAll = () => {
    vaults.forEach((vault) => removeVault(vault.id));
    setShowClearConfirm(false);
    showToast('All vaults cleared');
  };

  const handleNetworkChange = (newNetwork: string) => {
    if (newNetwork === 'mainnet' && !isMainnetUnlocked) {
      setShowMainnetConfirm(true);
      return;
    }
    setNetwork(newNetwork as 'mainnet' | 'testnet' | 'regtest');
    showToast(`Network switched to ${newNetwork}`);
  };

  const confirmMainnet = () => {
    if (confirmPhrase === 'I UNDERSTAND MAINNET IS REAL MONEY') {
      unlockMainnet();
      setNetwork('mainnet');
      setShowMainnetConfirm(false);
      setConfirmPhrase('');
      showToast('Network switched to mainnet');
    }
  };

  const networkDot =
    network === 'mainnet'
      ? 'bg-danger'
      : network === 'testnet'
      ? 'bg-success'
      : 'bg-muted-foreground';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="space-y-1">
        <div className="section-eyebrow">Configuration</div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your app preferences and data.</p>
      </div>

      {/* Network */}
      <div className="panel p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-semibold">Network</div>
        </div>
        <p className="text-xs text-muted-foreground">
          Select the Bitcoin network for new vaults. Mainnet requires explicit confirmation.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={network}
            onChange={(e) => handleNetworkChange(e.target.value)}
            className="field-input w-auto"
            aria-label="Select Bitcoin network"
          >
            <option value="testnet">Testnet</option>
            <option value="regtest">Regtest</option>
            <option value="mainnet">Mainnet</option>
          </select>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className={`h-2 w-2 rounded-full ${networkDot}`} />
            <span className="capitalize">{network}</span>
          </span>
        </div>
        {network === 'mainnet' && (
          <div className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <p>You are on Mainnet. This involves real Bitcoin. Be extremely careful.</p>
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="panel p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-semibold">Data management</div>
        </div>
        <p className="text-xs text-muted-foreground">
          {vaults.length > 0
            ? `You have ${vaults.length} saved vault${vaults.length > 1 ? 's' : ''}.`
            : 'No saved vaults.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={vaults.length === 0}
            className="btn-secondary"
          >
            <Download className="h-4 w-4" /> Export all vaults
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="panel p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm font-semibold">About</div>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Data storage</span>
            <span className="text-foreground">Local (device only)</span>
          </div>
          <div className="flex justify-between">
            <span>Architecture</span>
            <span className="text-foreground">Client-side only</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="panel border-danger/20 p-5 space-y-3">
        <div className="flex items-center gap-2 text-danger">
          <Trash2 className="h-4 w-4" />
          <span className="text-sm font-semibold">Danger zone</span>
        </div>
        <p className="text-xs text-muted-foreground">
          These actions cannot be undone. Your Bitcoin on the network is never affected.
        </p>
        
        {showClearConfirm ? (
          <div className="space-y-3">
            <div className="rounded-md border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
              Are you sure? This will delete all {vaults.length} vault{vaults.length > 1 ? 's' : ''} from this device.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-md bg-danger px-3 py-1.5 text-sm font-medium text-white hover:bg-danger/90"
              >
                Delete all
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="btn-ghost text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={vaults.length === 0}
            className="inline-flex items-center gap-2 text-sm text-danger hover:underline disabled:opacity-50 disabled:no-underline"
          >
            <Trash2 className="h-4 w-4" /> Clear all vaults
          </button>
        )}
      </div>

      {/* Mainnet confirmation modal */}
      {showMainnetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 p-6">
          <div className="panel w-full max-w-md p-6 space-y-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-danger/10 p-2 text-danger">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Switch to mainnet?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mainnet uses real Bitcoin. Mistakes can cause permanent loss of funds.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="field-label">Type the confirmation phrase</label>
              <div className="rounded-md bg-muted px-3 py-2 text-center font-mono text-xs">
                I UNDERSTAND MAINNET IS REAL MONEY
              </div>
              <input
                type="text"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="field-input"
                placeholder="Type carefully…"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMainnetConfirm(false);
                  setConfirmPhrase('');
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMainnet}
                disabled={confirmPhrase !== 'I UNDERSTAND MAINNET IS REAL MONEY'}
                className="btn-danger"
              >
                Switch to mainnet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
