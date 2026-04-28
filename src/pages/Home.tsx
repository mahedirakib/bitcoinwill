import { ArrowRight, FolderClosed, ShieldCheck } from 'lucide-react';
import type { NavView } from '@/components/AppShell';

interface HomeProps {
  onNavigate: (view: NavView) => void;
}

export const Home = ({ onNavigate }: HomeProps) => {
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

      {/* Saved vaults placeholder */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Saved vaults</h3>
          <button
            type="button"
            onClick={() => onNavigate('vaults')}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </button>
        </div>
        <div className="panel flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <FolderClosed className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium">No saved vaults yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Vaults you create or import are listed here for quick check-ins and status checks.
          </p>
        </div>
      </div>

      {/* Clarifications */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: 'Not a wallet', d: 'We never see, store, or manage your private keys. Only public keys are used.' },
          { t: 'Not a legal will', d: 'Technical recovery tooling. A separate legal estate plan is still required.' },
          { t: 'Not a custodian', d: 'Your Bitcoin stays on the network under your control until script rules permit recovery.' },
        ].map((x) => (
          <div key={x.t} className="panel p-5">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">{x.t}</h4>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
