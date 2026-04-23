import { ChevronRight, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PlanInput } from '@/lib/bitcoin/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TypeStepProps {
  input: PlanInput;
  errors: Record<string, string>;
  dispatch: React.Dispatch<{ type: 'UPDATE_INPUT'; payload: Partial<PlanInput> } | { type: 'SET_ERRORS'; payload: Record<string, string> }>;
  onCancel: () => void;
  onNext: () => void;
}

export const TypeStep = ({ input, errors, dispatch, onCancel, onNext }: TypeStepProps) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 md:space-y-10">
      <div className="space-y-3 text-center md:text-left">
        <h3 className="text-3xl font-black tracking-tight">Choose your inheritance strategy</h3>
        <p className="max-w-2xl font-medium text-foreground/58">
          This tool creates technical spending plans. It does not replace a legal estate plan.
        </p>
      </div>
      <div className="glass group relative overflow-hidden border-primary/20 bg-primary/5 p-6 md:p-10">
        <div className="absolute right-0 top-0 hidden p-8 opacity-[0.05] transition-opacity group-hover:opacity-[0.08] sm:block">
          <Clock className="h-32 w-32 md:h-40 md:w-40" />
        </div>
        <div className="relative flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="h-fit self-start rounded-2xl bg-primary p-4 shadow-lg shadow-primary/20">
            <Clock className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="min-w-0 space-y-3">
            <h4 className="text-2xl font-black tracking-tight">Timelock Recovery</h4>
            <p className="max-w-2xl text-base font-medium leading-relaxed text-foreground/72 md:text-lg">
              Maintain 100% control of your funds. If you stop moving your Bitcoin for a chosen period, a secondary key becomes eligible to claim them.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">Use Modern Address Format</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Recommended</span>
          </div>
          <p className="max-w-xl text-sm text-foreground/55">
            Taproot (bc1p...) - Better privacy & lower fees
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={input.address_type === 'p2tr'}
          onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { address_type: input.address_type === 'p2tr' ? 'p2wsh' : 'p2tr' } })}
          className={cn(
            "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
            input.address_type === 'p2tr' ? "bg-primary" : "bg-muted-foreground/30"
          )}
          aria-label="Toggle Taproot address format"
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
              input.address_type === 'p2tr' ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">Enable Social Recovery</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">Advanced</span>
          </div>
          <p className="max-w-xl text-sm text-foreground/55">
            Split beneficiary key among trusted people
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={input.recovery_method === 'social'}
          onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { recovery_method: input.recovery_method === 'social' ? 'single' : 'social' } })}
          className={cn(
            "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/15",
            input.recovery_method === 'social' ? "bg-orange-500" : "bg-muted-foreground/30"
          )}
          aria-label="Toggle social recovery"
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
              input.recovery_method === 'social' ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {input.recovery_method === 'social' && (
        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 rounded-2xl border border-orange-500/10 bg-orange-500/5 p-6">
          <p className="text-sm font-medium text-orange-600/80">
            Choose how to distribute trust among your recovery group:
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { sss_config: { threshold: 2, total: 3 } } })}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/10",
                input.sss_config?.threshold === 2
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-border hover:border-orange-500/30"
              )}
            >
              <div className="space-y-1">
                <span className="text-sm font-bold">2-of-3 Shares</span>
                <p className="text-xs text-foreground/60">
                  Any 2 of 3 people can recover
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { sss_config: { threshold: 3, total: 5 } } })}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/10",
                input.sss_config?.threshold === 3
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-border hover:border-orange-500/30"
              )}
            >
              <div className="space-y-1">
                <span className="text-sm font-bold">3-of-5 Shares</span>
                <p className="text-xs text-foreground/60">
                  Any 3 of 5 people can recover
                </p>
              </div>
            </button>
          </div>
          {!input.sss_config && (
            <p className="text-xs text-orange-500 font-medium">
              Please select a share configuration to continue
            </p>
          )}
          {errors.sss && (
            <p className="text-xs text-red-500 font-medium">{errors.sss}</p>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onCancel} className="text-left font-bold text-foreground/45 transition-colors hover:text-foreground/70">Cancel</button>
        <button type="button" onClick={onNext} className="btn-primary w-full sm:w-auto">
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
