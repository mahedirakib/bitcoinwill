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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="space-y-3 text-center">
        <h3 className="text-2xl font-bold">Choose your inheritance strategy</h3>
        <p className="text-foreground/50 max-w-xl mx-auto font-medium">This app creates technical spending plans, not legal documents.</p>
      </div>
      <div className="glass p-10 border-primary/20 bg-primary/5 space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity">
          <Clock className="w-40 h-40" />
        </div>
        <div className="flex gap-6 relative">
          <div className="bg-primary shadow-lg shadow-primary/20 p-4 rounded-2xl h-fit">
            <Clock className="text-primary-foreground w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h4 className="text-2xl font-bold">Timelock Recovery</h4>
            <p className="text-lg text-foreground/70 leading-relaxed font-medium">
              Maintain 100% control of your funds. If you stop moving your Bitcoin for a specific period, 
              a secondary key (your heir) becomes eligible to claim the funds.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Use Modern Address Format</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Recommended</span>
          </div>
          <p className="text-xs text-foreground/50">
            Taproot (bc1p...) - Better privacy & lower fees
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { address_type: input.address_type === 'p2tr' ? 'p2wsh' : 'p2tr' } })}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            input.address_type === 'p2tr' ? "bg-primary" : "bg-muted-foreground/30"
          )}
          aria-label="Toggle Taproot address format"
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              input.address_type === 'p2tr' ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Enable Social Recovery</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">Advanced</span>
          </div>
          <p className="text-xs text-foreground/50">
            Split beneficiary key among trusted people
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { recovery_method: input.recovery_method === 'social' ? 'single' : 'social' } })}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            input.recovery_method === 'social' ? "bg-orange-500" : "bg-muted-foreground/30"
          )}
          aria-label="Toggle social recovery"
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              input.recovery_method === 'social' ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {input.recovery_method === 'social' && (
        <div className="space-y-4 p-6 rounded-2xl bg-orange-500/5 border border-orange-500/10 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-medium text-orange-600/80">
            Choose how to distribute trust among your recovery group:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { sss_config: { threshold: 2, total: 3 } } })}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
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
                "p-4 rounded-xl border-2 text-left transition-all",
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

      <div className="flex justify-between items-center pt-6">
        <button type="button" onClick={onCancel} className="text-foreground/40 font-bold hover:text-foreground/60 transition-colors">Cancel</button>
        <button type="button" onClick={onNext} className="btn-primary flex items-center gap-2">
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
