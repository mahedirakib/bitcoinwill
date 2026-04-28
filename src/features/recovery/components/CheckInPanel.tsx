import { History } from 'lucide-react';
import { StatusCard } from '@/components/DataDisplay';
import type { CheckInPanelProps } from '../types';

export const CheckInPanel = ({
  model,
  checkInPlan,
  checkInCadence,
  onCadenceChange,
}: CheckInPanelProps) => {
  return (
    <section className="space-y-4 print:hidden">
      <h2 className="flex items-center gap-2 border-b border-border pb-2 text-base font-semibold print:border-gray-300">
        <History className="h-4 w-4 text-foreground/70" /> Owner check-in helper
      </h2>

      <p className="text-sm leading-relaxed text-muted-foreground">
        A check-in means the owner spends and re-locks funds to reset the CSV timer. Choose a cadence and compare it with live confirmations.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="checkin-cadence" className="field-label">Recommended cadence</label>
        <select
          id="checkin-cadence"
          value={String(checkInCadence)}
          onChange={(event) => onCadenceChange(Number(event.target.value))}
          className="w-full cursor-pointer rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong focus:border-foreground focus:outline-none"
        >
          <option value="0.4">Aggressive safety (every 40% of locktime)</option>
          <option value="0.5">Balanced safety (every 50% of locktime)</option>
          <option value="0.7">Minimal maintenance (every 70% of locktime)</option>
        </select>
      </div>

      {checkInPlan && (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusCard
            label="Recommended interval"
            value={`${checkInPlan.recommendedCheckInEveryBlocks} blocks`}
            detail={`~${checkInPlan.recommendedCheckInEveryApprox}`}
          />
          <StatusCard
            label="Current status"
            value={
              checkInPlan.status === 'beneficiary_path_open'
                ? 'Beneficiary path open'
                : checkInPlan.status === 'due_now'
                  ? 'Check-in due'
                  : checkInPlan.status === 'on_track'
                    ? 'On track'
                    : 'Needs vault scan'
            }
            detail={
              checkInPlan.status === 'unknown'
                ? 'Run a vault refresh to calculate exact deadlines.'
                : `Locktime is ${model.locktimeBlocks} blocks total.`
            }
          />
          {typeof checkInPlan.confirmationsSinceLastFunding === 'number' && (
            <StatusCard
              label="Since last funding"
              value={`${checkInPlan.confirmationsSinceLastFunding} confirmations`}
              detail="Based on the latest confirmed funding transaction."
            />
          )}
          {typeof checkInPlan.blocksUntilBeneficiaryEligible === 'number' && (
            <StatusCard
              label="Until beneficiary eligible"
              value={
                checkInPlan.blocksUntilBeneficiaryEligible > 0
                  ? `${checkInPlan.blocksUntilBeneficiaryEligible} blocks`
                  : 'Now'
              }
              detail={
                checkInPlan.blocksUntilBeneficiaryEligible > 0
                  ? `~${checkInPlan.beneficiaryEligibilityApprox}`
                  : 'Beneficiary path may already be spendable.'
              }
            />
          )}
        </div>
      )}
    </section>
  );
};
