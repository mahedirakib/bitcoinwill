import { useMemo } from 'react';
import {
  ArrowRight,
  FolderClosed,
  ShieldCheck,
  ExternalLink,
  Activity,
  Clock,
  Shield,
  AlertTriangle,
  Plus,
  Database,
} from 'lucide-react';
import type { NavView } from '@/components/AppShell';
import { useVaults } from '@/hooks/useVaults';
import type { SavedVault } from '@/lib/vaultStorage';

interface HomeProps {
  onNavigate: (view: NavView) => void;
  onViewVault?: (vault: SavedVault) => void;
}

const VaultPreview = ({ vault, onClick }: { vault: SavedVault; onClick: () => void }) => {
  const networkColor =
    vault.network === 'mainnet'
      ? 'bg-danger/10 text-danger'
      : vault.network === 'testnet'
      ? 'bg-success/10 text-success'
      : 'bg-muted text-muted-foreground';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md border border-border bg-white p-3 text-left transition-colors hover:border-border-strong hover:bg-muted/30"
    >
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${networkColor}`}>
        <span className="text-xs font-semibold uppercase">{vault.network.slice(0, 2)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{vault.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {vault.address.slice(0, 16)}…{vault.address.slice(-8)}
        </p>
      </div>
      {vault.lastCheckedAt && (
        <span className="flex-shrink-0 text-xs text-success" title="Status checked">
          <Activity className="h-3 w-3" />
        </span>
      )}
      <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
    </button>
  );
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  color: string;
}) => (
  <div className="flex items-center gap-3 rounded-md border border-border bg-white p-3">
    <div className={`rounded-md p-2 ${color}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

export const Home = ({ onNavigate, onViewVault }: HomeProps) => {
  const { vaults } = useVaults();
  const recentVaults = vaults.slice(0, 3);

  const stats = useMemo(() => {
    const total = vaults.length;
    const mainnet = vaults.filter((v) => v.network === 'mainnet').length;
    const testnet = vaults.filter((v) => v.network === 'testnet').length;
    const checked = vaults.filter((v) => v.lastCheckedAt).length;
    return { total, mainnet, testnet, checked };
  }, [vaults]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Primary actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-6 md:col-span-2">
          <div className="section-eyebrow mb-2">Get started</div>
          <h2 className="text-xl font-semibold tracking-tight">Create a Bitcoin inheritance plan</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Generate a script-based vault address. You stay in control of your keys —
            the plan is enforced by Bitcoin itself, not by us.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => onNavigate('create')} className="btn-accent">
              Create plan <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onNavigate('learn')} className="btn-secondary">
              How it works
            </button>
          </div>
        </div>

        <div className="panel p-6">
          <div className="section-eyebrow mb-2">Already have a vault?</div>
          <h2 className="text-base font-semibold">Recover or check status</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Import a recovery kit to inspect a vault, broadcast a recovery transaction, or run an owner check-in.
          </p>
          <div className="mt-5">
            <button type="button" onClick={() => onNavigate('recover')} className="btn-secondary">
              Open recovery <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {vaults.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <StatCard
            label="Total vaults"
            value={stats.total}
            icon={Database}
            color="bg-muted text-foreground"
          />
          <StatCard
            label="Mainnet"
            value={stats.mainnet}
            icon={AlertTriangle}
            color="bg-danger/10 text-danger"
          />
          <StatCard
            label="Testnet"
            value={stats.testnet}
            icon={Shield}
            color="bg-success/10 text-success"
          />
          <StatCard
            label="Checked"
            value={stats.checked}
            icon={Activity}
            color="bg-primary/10 text-primary"
          />
        </div>
      )}

      {/* Saved vaults */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Saved vaults</h3>
          {vaults.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('vaults')}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all →
            </button>
          )}
        </div>
        
        {recentVaults.length > 0 ? (
          <div className="space-y-2">
            {recentVaults.map((vault) => (
              <VaultPreview
                key={vault.id}
                vault={vault}
                onClick={() => onViewVault?.(vault)}
              />
            ))}
            {vaults.length > 3 && (
              <p className="text-center text-xs text-muted-foreground">
                +{vaults.length - 3} more vaults
              </p>
            )}
          </div>
        ) : (
          <div className="panel flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="rounded-full bg-muted p-3">
              <FolderClosed className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No saved vaults yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Create your first vault to get started with Bitcoin inheritance planning.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('create')}
              className="btn-accent mt-2"
            >
              <Plus className="h-4 w-4" /> Create vault
            </button>
          </div>
        )}
      </div>

      {/* Clarifications */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: 'Not a wallet', d: 'We never see, store, or manage your private keys. Only public keys are used.', icon: ShieldCheck },
          { t: 'Not a legal will', d: 'Technical recovery tooling. A separate legal estate plan is still required.', icon: Clock },
          { t: 'Not a custodian', d: 'Your Bitcoin stays on the network under your control until script rules permit recovery.', icon: Shield },
        ].map((x) => (
          <div key={x.t} className="panel p-5">
            <div className="mb-2 flex items-center gap-2">
              <x.icon className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">{x.t}</h4>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
