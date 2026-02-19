import { ExternalLink, RefreshCw, Activity } from 'lucide-react';
import { StatusCard } from '@/components/DataDisplay';
import { EXPLORER_PROVIDERS } from '@/lib/bitcoin/explorer';
import { buildExplorerTxUrl, formatBtc, formatSats } from '@/lib/bitcoin/explorer';
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
  const recoveryNetwork = model.network.toLowerCase() as 'mainnet' | 'testnet';
  const providerForLinks = vaultStatus?.providerUsed ?? explorerProvider;

  return (
    <section className="space-y-6 print:hidden">
      <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2 print:border-gray-300">
        <Activity className="w-5 h-5 text-primary" /> Live Vault Status
      </h2>

      <p className="text-sm text-foreground/70 leading-relaxed">
        Use public explorers to verify balance, funding history, and confirmations directly from this page.
      </p>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="explorer-provider" className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
              Explorer Provider
            </label>
            <select
              id="explorer-provider"
              value={explorerProvider}
              onChange={(event) => onProviderChange(event.target.value as 'mempool' | 'blockstream')}
              className="mt-2 w-full bg-muted border border-border rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
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
            className="sm:self-end bg-white border border-border rounded-xl px-4 py-3 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            {isCheckingStatus ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>

        {statusError && (
          <div role="alert" className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 text-sm font-medium">
            {statusError}
          </div>
        )}

        {vaultStatus && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <StatusCard
                label="Confirmed Balance"
                value={`${formatBtc(vaultStatus.confirmedBalanceSats)} BTC`}
                detail={`${formatSats(vaultStatus.confirmedBalanceSats)} sats`}
              />
              <StatusCard
                label="Pending (Mempool)"
                value={`${formatBtc(vaultStatus.unconfirmedBalanceSats)} BTC`}
                detail={`${formatSats(vaultStatus.unconfirmedBalanceSats)} sats`}
              />
              <StatusCard
                label="Total"
                value={`${formatBtc(vaultStatus.totalBalanceSats)} BTC`}
                detail={`${formatSats(vaultStatus.totalBalanceSats)} sats`}
              />
              <StatusCard
                label="Transactions Seen"
                value={String(vaultStatus.txCount)}
                detail={`Source: ${vaultStatus.providerLabel}${vaultStatus.usedFallbackProvider ? ' (fallback used)' : ''}`}
              />
            </div>

            {vaultStatus.lastConfirmedFundingTx && (
              <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">Latest Confirmed Funding Tx</p>
                <p className="font-mono text-[11px] break-all">{vaultStatus.lastConfirmedFundingTx.txid}</p>
                <p className="text-xs text-foreground/70">
                  Confirmations:{' '}
                  <strong>
                    {typeof vaultStatus.lastConfirmedFundingTx.confirmations === 'number'
                      ? vaultStatus.lastConfirmedFundingTx.confirmations
                      : 'unknown'}
                  </strong>
                </p>
                <a
                  href={buildExplorerTxUrl(recoveryNetwork, providerForLinks, vaultStatus.lastConfirmedFundingTx.txid)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
                >
                  View funding tx <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
