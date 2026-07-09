import { Activity, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { StatusCard } from '@/components/DataDisplay';
import {
  EXPLORER_PROVIDERS,
  buildExplorerTxUrl,
  formatBtc,
  formatSats,
} from '@/lib/bitcoin/explorer';
import type { BitcoinNetwork } from '@/lib/bitcoin/types';
import type { VaultStatusPanelProps } from '../types';

export const VaultStatusPanel = ({
  model,
  vaultStatus,
  statusError,
  isCheckingStatus,
  explorerProvider,
  onProviderChange,
  onRefresh,
}: VaultStatusPanelProps) => {
  // model.network is upper-cased in instructions.ts and can be REGTEST. This
  // panel is only rendered when a public explorer is available (RecoveryPage
  // gates regtest out), but type it as the full union so the cast is sound and
  // buildExplorerTxUrl can throw meaningfully if misused.
  const recoveryNetwork = model.network.toLowerCase() as BitcoinNetwork;
  const providerForLinks = vaultStatus?.providerUsed ?? explorerProvider;

  return (
    <section className="space-y-4 print:hidden">
      <h2 className="flex items-center gap-2 border-b border-border pb-2 text-base font-semibold print:border-gray-300">
        <Activity className="h-4 w-4 text-foreground/70" /> Live vault status
      </h2>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Use public explorers to verify balance, funding history, and confirmations directly from this page.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="explorer-provider" className="field-label">
            Explorer provider
          </label>
          <select
            id="explorer-provider"
            value={explorerProvider}
            onChange={(event) => onProviderChange(event.target.value as 'mempool' | 'blockstream')}
            className="w-full cursor-pointer rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong focus:border-foreground focus:outline-none"
          >
            {EXPLORER_PROVIDERS.map((provider) => (
              <option key={provider} value={provider}>
                {provider === 'mempool' ? 'Mempool.space' : 'Blockstream.info'}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isCheckingStatus}
          className="btn-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
          {isCheckingStatus ? 'Checking…' : 'Refresh status'}
        </button>
      </div>

      {statusError && (
        <div className="space-y-3">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger/5 p-3 text-sm text-danger"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Unable to fetch vault status</p>
              <p className="text-xs text-danger/80 mt-1">{statusError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isCheckingStatus}
            className="btn-secondary w-full"
          >
            <RefreshCw className={`h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            {isCheckingStatus ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      )}

      {vaultStatus && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatusCard
              label="Confirmed balance"
              value={`${formatBtc(vaultStatus.confirmedBalanceSats)} BTC`}
              detail={`${formatSats(vaultStatus.confirmedBalanceSats)} sats`}
            />
            <StatusCard
              label="Pending (mempool)"
              value={`${formatBtc(vaultStatus.unconfirmedBalanceSats)} BTC`}
              detail={`${formatSats(vaultStatus.unconfirmedBalanceSats)} sats`}
            />
            <StatusCard
              label="Total"
              value={`${formatBtc(vaultStatus.totalBalanceSats)} BTC`}
              detail={`${formatSats(vaultStatus.totalBalanceSats)} sats`}
            />
            <StatusCard
              label="Transactions seen"
              value={String(vaultStatus.txCount)}
              detail={`Source: ${vaultStatus.providerLabel}${
                vaultStatus.usedFallbackProvider ? ' (fallback used)' : ''
              }`}
            />
          </div>

          {vaultStatus.lastConfirmedFundingTx && (
            <div className="rounded-md border border-border bg-muted/40 p-4 space-y-1.5">
              <p className="section-eyebrow">Latest confirmed funding tx</p>
              <p className="break-all font-mono text-[11px] text-foreground">
                {vaultStatus.lastConfirmedFundingTx.txid}
              </p>
              <p className="text-xs text-muted-foreground">
                Confirmations:{' '}
                <strong className="font-semibold text-foreground">
                  {typeof vaultStatus.lastConfirmedFundingTx.confirmations === 'number'
                    ? vaultStatus.lastConfirmedFundingTx.confirmations
                    : 'unknown'}
                </strong>
              </p>
              <a
                href={buildExplorerTxUrl(
                  recoveryNetwork,
                  providerForLinks,
                  vaultStatus.lastConfirmedFundingTx.txid,
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View funding transaction in blockchain explorer (opens in new tab)"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-2 hover:text-foreground/70"
              >
                View funding tx <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
