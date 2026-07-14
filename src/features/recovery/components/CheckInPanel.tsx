import { History } from 'lucide-react';
import { StatusCard } from '@/components/DataDisplay';
import { formatBtc, formatSats } from '@/lib/bitcoin/explorer';
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
        A check-in means the owner spends every vault UTXO and re-locks the funds. Each UTXO has its own CSV timer, so the oldest output determines urgency.
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
          {typeof checkInPlan.oldestUtxoConfirmations === 'number' && (
            <StatusCard
              label="Oldest unspent output"
              value={`${checkInPlan.oldestUtxoConfirmations} confirmations`}
              detail="Check-in urgency is based on the oldest current UTXO."
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
          <StatusCard
            label="Beneficiary-eligible now"
            value={`${formatBtc(checkInPlan.matureBalanceSats)} BTC`}
            detail={`${formatSats(checkInPlan.matureBalanceSats)} sats across ${checkInPlan.matureUtxoCount} UTXO(s)`}
          />
          <StatusCard
            label="Still timelocked"
            value={`${formatBtc(checkInPlan.immatureBalanceSats)} BTC`}
            detail={`${formatSats(checkInPlan.immatureBalanceSats)} sats across ${checkInPlan.immatureUtxoCount} confirmed UTXO(s)`}
          />
          {checkInPlan.unconfirmedUtxoCount > 0 && (
            <StatusCard
              label="Awaiting confirmation"
              value={`${formatBtc(checkInPlan.unconfirmedBalanceSats)} BTC`}
              detail={`${formatSats(checkInPlan.unconfirmedBalanceSats)} sats; CSV age starts after confirmation.`}
            />
          )}
          {checkInPlan.unknownAgeUtxoCount > 0 && (
            <StatusCard
              label="Confirmation age unavailable"
              value={`${formatBtc(checkInPlan.unknownAgeBalanceSats)} BTC`}
              detail={`${formatSats(checkInPlan.unknownAgeBalanceSats)} sats; verify these confirmed UTXOs with another source.`}
            />
          )}
        </div>
      )}
    </section>
  );
};
