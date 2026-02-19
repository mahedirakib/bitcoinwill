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
    <section className="space-y-6 print:hidden">
      <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2 print:border-gray-300">
        <History className="w-5 h-5 text-primary" /> Owner Check-In Helper
      </h2>

      <p className="text-sm text-foreground/70 leading-relaxed">
        A check-in means the owner spends and re-locks funds to reset the CSV timer. Choose a cadence and compare it with live confirmations.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="checkin-cadence" className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
            Recommended Cadence
          </label>
          <select
            id="checkin-cadence"
            value={String(checkInCadence)}
            onChange={(event) => onCadenceChange(Number(event.target.value))}
            className="mt-2 w-full bg-muted border border-border rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="0.4">Aggressive safety (every 40% of locktime)</option>
            <option value="0.5">Balanced safety (every 50% of locktime)</option>
            <option value="0.7">Minimal maintenance (every 70% of locktime)</option>
          </select>
        </div>

        {checkInPlan && (
          <div className="grid sm:grid-cols-2 gap-3">
            <StatusCard
              label="Recommended Interval"
              value={`${checkInPlan.recommendedCheckInEveryBlocks} blocks`}
              detail={`~${checkInPlan.recommendedCheckInEveryApprox}`}
            />
            <StatusCard
              label="Current Status"
              value={
                checkInPlan.status === 'beneficiary_path_open'
                  ? 'Beneficiary Path Open'
                  : checkInPlan.status === 'due_now'
                    ? 'Check-In Due'
                    : checkInPlan.status === 'on_track'
                      ? 'On Track'
                      : 'Needs Vault Scan'
              }
              detail={
                checkInPlan.status === 'unknown'
                  ? 'Run a vault refresh to calculate exact deadlines.'
                  : `Locktime is ${model.locktimeBlocks} blocks total.`
              }
            />
            {typeof checkInPlan.confirmationsSinceLastFunding === 'number' && (
              <StatusCard
                label="Since Last Funding"
                value={`${checkInPlan.confirmationsSinceLastFunding} confirmations`}
                detail="Based on the latest confirmed funding transaction."
              />
            )}
            {typeof checkInPlan.blocksUntilBeneficiaryEligible === 'number' && (
              <StatusCard
                label="Until Beneficiary Eligible"
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
      </div>
    </section>
  );
};
