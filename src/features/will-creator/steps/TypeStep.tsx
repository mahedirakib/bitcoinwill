import { ChevronRight, Clock } from 'lucide-react';
import type { PlanInput } from '@/lib/bitcoin/types';

interface TypeStepProps {
  input: PlanInput;
  errors: Record<string, string>;
  dispatch: React.Dispatch<{ type: 'UPDATE_INPUT'; payload: Partial<PlanInput> } | { type: 'SET_ERRORS'; payload: Record<string, string> }>;
  onCancel: () => void;
  onNext: () => void;
}

const Toggle = ({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: () => void;
  ariaLabel: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 ${
      on ? 'bg-foreground' : 'bg-border-strong'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        on ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
);

export const TypeStep = ({ input, errors, dispatch, onCancel, onNext }: TypeStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Choose your inheritance strategy</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This tool creates technical spending plans. It does not replace a legal estate plan.
        </p>
      </div>

      {/* Strategy card (single option for now) */}
      <div className="rounded-md border border-border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-foreground/5 p-2 text-foreground">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Timelock recovery</h4>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              You keep full control of the funds. If you stop moving the Bitcoin for the configured period, a beneficiary key becomes eligible to claim them.
            </p>
          </div>
        </div>
      </div>

      {/* Address format toggle */}
      <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-white p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Modern address format</span>
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Taproot (bc1p…) — better privacy and lower fees.
          </p>
        </div>
        <Toggle
          on={input.address_type === 'p2tr'}
          onChange={() =>
            dispatch({
              type: 'UPDATE_INPUT',
              payload: { address_type: input.address_type === 'p2tr' ? 'p2wsh' : 'p2tr' },
            })
          }
          ariaLabel="Toggle Taproot address format"
        />
      </div>

      {/* Social recovery toggle */}
      <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-white p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Enable social recovery</span>
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Advanced
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Split the beneficiary key among trusted people using Shamir Secret Sharing.
          </p>
        </div>
        <Toggle
          on={input.recovery_method === 'social'}
          onChange={() =>
            dispatch({
              type: 'UPDATE_INPUT',
              payload: { recovery_method: input.recovery_method === 'social' ? 'single' : 'social' },
            })
          }
          ariaLabel="Toggle social recovery"
        />
      </div>

      {input.recovery_method === 'social' && (
        <div className="rounded-md border border-border bg-muted/40 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Choose how to distribute trust:</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { sss_config: { threshold: 2, total: 3 } } })}
              className={`rounded-md border p-3 text-left transition-colors ${
                input.sss_config?.threshold === 2
                  ? 'border-foreground bg-white'
                  : 'border-border bg-white hover:border-border-strong'
              }`}
            >
              <div className="text-sm font-semibold">2-of-3 shares</div>
              <p className="mt-1 text-xs text-muted-foreground">Any 2 of 3 people can recover.</p>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { sss_config: { threshold: 3, total: 5 } } })}
              className={`rounded-md border p-3 text-left transition-colors ${
                input.sss_config?.threshold === 3
                  ? 'border-foreground bg-white'
                  : 'border-border bg-white hover:border-border-strong'
              }`}
            >
              <div className="text-sm font-semibold">3-of-5 shares</div>
              <p className="mt-1 text-xs text-muted-foreground">Any 3 of 5 people can recover.</p>
            </button>
          </div>
          {!input.sss_config && (
            <p className="text-xs text-muted-foreground">Select a share configuration to continue.</p>
          )}
          {errors.sss && <p className="text-xs text-danger">{errors.sss}</p>}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        <button type="button" onClick={onNext} className="btn-primary">
          Continue <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
