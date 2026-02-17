import { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  ChevronLeft, 
  AlertTriangle, 
  Info, 
  FileText,
  Copy,
  Check,
  History,
  Activity,
  Send,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  InstructionModel,
  buildInstructions,
  generateInstructionTxt,
  validateAndNormalizeRecoveryKit,
} from '@/lib/bitcoin/instructions';
import { downloadTxt } from '@/lib/utils/download';
import type { BitcoinNetwork, PlanInput, PlanOutput } from '@/lib/bitcoin/types';
import logo from '@/assets/logo.png';
import { useToast } from '@/components/Toast';
import { buildCheckInPlan } from '@/lib/bitcoin/checkin';
import {
  EXPLORER_PROVIDERS,
  type AddressSummary,
  type BroadcastTransactionResult,
  type ExplorerProvider,
  broadcastTransaction,
  buildExplorerAddressUrl,
  buildExplorerTxUrl,
  fetchAddressSummary,
  formatBtc,
  formatSats,
  supportsPublicExplorerNetwork,
} from '@/lib/bitcoin/explorer';

interface InstructionsProps {
  initialData?: {
    plan: PlanInput;
    result: PlanOutput;
    created_at?: string;
  };
  onBack: () => void;
}

const MAINNET_BROADCAST_CONFIRMATION = 'I UNDERSTAND THIS BROADCASTS ON MAINNET';

const Instructions = ({ initialData, onBack }: InstructionsProps) => {
  const [model, setModel] = useState<InstructionModel | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [explorerProvider, setExplorerProvider] = useState<ExplorerProvider>('mempool');
  const [vaultStatus, setVaultStatus] = useState<AddressSummary | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [rawTxHex, setRawTxHex] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<BroadcastTransactionResult | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMainnetPhrase, setBroadcastMainnetPhrase] = useState('');
  const [checkInCadence, setCheckInCadence] = useState(0.5);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialData?.plan && initialData?.result) {
      try {
        const normalized = validateAndNormalizeRecoveryKit(initialData);
        const m = buildInstructions(normalized.plan, normalized.result, normalized.created_at);
        setModel(m);
      } catch (error) {
        showToast((error as Error).message || 'Invalid Recovery Kit');
      }
    }
  }, [initialData, showToast]);

  useEffect(() => {
    setVaultStatus(null);
    setStatusError(null);
    setRawTxHex('');
    setBroadcastResult(null);
    setBroadcastError(null);
    setBroadcastMainnetPhrase('');
  }, [model?.address, model?.network]);

  const handleJsonUpload = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = validateAndNormalizeRecoveryKit(parsed);
      const m = buildInstructions(normalized.plan, normalized.result, normalized.created_at);
      setModel(m);
      showToast("Instructions Loaded Successfully");
    } catch (error) {
      const message = (error as Error).message;
      showToast(message || "Error parsing JSON");
    }
  };

  const recoveryNetwork = (model?.network.toLowerCase() ?? 'testnet') as BitcoinNetwork;
  const publicExplorerAvailable = supportsPublicExplorerNetwork(recoveryNetwork);
  const providerForLinks = vaultStatus?.providerUsed ?? explorerProvider;
  const explorerAddressUrl =
    model && publicExplorerAvailable
      ? buildExplorerAddressUrl(recoveryNetwork, providerForLinks, model.address)
      : undefined;

  const checkInPlan = model
    ? buildCheckInPlan(
        model.locktimeBlocks,
        vaultStatus?.lastConfirmedFundingTx?.confirmations,
        checkInCadence,
      )
    : null;

  const handleRefreshVaultStatus = async () => {
    if (!model) return;
    if (!publicExplorerAvailable) {
      const message = 'Public explorers do not support Regtest. Connect a local node for live status.';
      setStatusError(message);
      showToast(message);
      return;
    }

    setIsCheckingStatus(true);
    setStatusError(null);
    try {
      const summary = await fetchAddressSummary({
        network: recoveryNetwork,
        address: model.address,
        provider: explorerProvider,
        fallbackToOtherProvider: true,
      });
      setVaultStatus(summary);
      showToast(`Vault status updated via ${summary.providerLabel}`);
    } catch (error) {
      const message = (error as Error).message || 'Could not fetch vault status.';
      setStatusError(message);
      showToast(message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleBroadcastTransaction = async () => {
    if (!model) return;
    if (!publicExplorerAvailable) {
      const message = 'Public broadcast is unavailable on Regtest. Use your local node RPC instead.';
      setBroadcastError(message);
      showToast(message);
      return;
    }
    if (recoveryNetwork === 'mainnet' && broadcastMainnetPhrase !== MAINNET_BROADCAST_CONFIRMATION) {
      const message = 'Mainnet broadcast requires the exact confirmation phrase.';
      setBroadcastError(message);
      showToast(message);
      return;
    }

    setIsBroadcasting(true);
    setBroadcastError(null);
    setBroadcastResult(null);
    try {
      const result = await broadcastTransaction({
        network: recoveryNetwork,
        provider: explorerProvider,
        rawTxHex,
        fallbackToOtherProvider: true,
      });
      setBroadcastResult(result);
      showToast(`Broadcast accepted by ${result.providerLabel}`);
    } catch (error) {
      const message = (error as Error).message || 'Transaction broadcast failed.';
      setBroadcastError(message);
      showToast(message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (!model) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 space-y-8 animate-in fade-in">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-foreground/60 hover:text-primary">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 text-primary/20 mx-auto" />
          <h1 className="text-3xl font-bold">View Beneficiary Instructions</h1>
          <p className="text-foreground/70">Paste your Recovery Kit JSON below to view the claim instructions.</p>
        </div>
        <label htmlFor="recovery-kit-json" className="sr-only">Recovery kit JSON</label>
        <textarea
          id="recovery-kit-json"
          className="w-full h-48 bg-muted border border-border rounded-xl p-4 font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder='{"version": "0.1.0", "plan": {...}, "result": {...}}'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        <button 
          type="button"
          onClick={handleJsonUpload}
          className="btn-primary w-full"
        >
          Load Instructions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col gap-4 items-start sm:flex-row sm:justify-between sm:items-center print:hidden">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors font-semibold">
          <ChevronLeft className="w-4 h-4" /> Back to App
        </button>
        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
          <button 
            type="button"
            onClick={() => downloadTxt('beneficiary-instructions.txt', generateInstructionTxt(model))}
            className="flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-lg text-sm font-bold hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" /> Download TXT
          </button>
          <button 
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>

      <article className="space-y-12 print:text-black print:space-y-8 bg-white p-8 md:p-12 rounded-3xl border border-border shadow-sm print:border-none print:shadow-none print:p-0">
        <header className="space-y-4 text-center flex flex-col items-center">
          <img src={logo} alt="Bitcoin Will Logo" className="w-20 h-20 object-contain mb-2" />
          <h1 className="text-4xl font-black tracking-tight">Beneficiary Instructions</h1>
          <p className="text-foreground/60 print:text-gray-500 uppercase tracking-widest text-[10px] font-bold">
            Bitcoin Will • Non-Custodial Inheritance Vault
          </p>
        </header>

        {/* Section: What this is */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2 print:border-gray-300">
            <Info className="w-5 h-5 text-primary" /> What this is
          </h2>
          <p className="text-foreground/80 print:text-gray-700 leading-relaxed">
            This document provides the technical instructions required to claim Bitcoin from a "Dead Man's Switch" vault. 
            These funds were intended for you (the Beneficiary) if the Owner becomes inactive for a defined period.
          </p>
        </section>

        {/* Section: When to claim */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2 print:border-gray-300">
             <History className="w-5 h-5 text-primary" /> When you can claim
          </h2>
          <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl print:bg-gray-50 print:border-gray-300">
            <p className="text-sm leading-relaxed text-foreground/80">
              <strong>Condition:</strong> You can claim these funds ONLY if they have remained unmoved at the vault address for at least <strong>{model.locktimeBlocks} blocks</strong> (approximately <strong>{model.locktimeApprox}</strong>) since the last funding transaction was confirmed.
            </p>
          </div>
        </section>

        {/* Section: Recovery Steps */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-2 print:border-gray-300">Recovery Steps</h2>
          <ol className="space-y-4">
            {[
              {
                title: "Confirm Funds",
                desc: "Check the Vault Address on a blockchain explorer to ensure it still holds a balance."
              },
              {
                title: "Verify Confirmation",
                desc: `Find the last funding transaction. Ensure it has at least ${model.locktimeBlocks} confirmations before attempting to claim.`
              },
              {
                title: "Prepare Wallet",
                desc: "Use an advanced Bitcoin wallet (e.g., Sparrow Wallet) that supports P2WSH scripts and custom descriptors."
              },
              {
                title: "Construct Spend",
                desc: "Construct a transaction spending from the vault address. You must provide your signature and the Witness Script listed below."
              },
              {
                title: "Broadcast",
                desc: "Once signed and valid, broadcast the transaction to the network to move the funds to an address you control."
              }
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs print:bg-gray-100 print:text-black print:border print:border-gray-200">
                  {i + 1}
                </span>
                <div>
                  <h4 className="font-bold text-sm">{step.title}</h4>
                  <p className="text-sm text-foreground/70 print:text-gray-600">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Section: Live Vault Status */}
        <section className="space-y-6 print:hidden">
          <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2 print:border-gray-300">
            <Activity className="w-5 h-5 text-primary" /> Live Vault Status
          </h2>

          <p className="text-sm text-foreground/70 leading-relaxed">
            Use public explorers to verify balance, funding history, and confirmations directly from this page.
          </p>

          {publicExplorerAvailable ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="explorer-provider" className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
                    Explorer Provider
                  </label>
                  <select
                    id="explorer-provider"
                    value={explorerProvider}
                    onChange={(event) => setExplorerProvider(event.target.value as ExplorerProvider)}
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
                  onClick={handleRefreshVaultStatus}
                  disabled={isCheckingStatus}
                  className="sm:self-end bg-white border border-border rounded-xl px-4 py-3 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  {isCheckingStatus ? 'Checking...' : 'Refresh Status'}
                </button>
              </div>

              {explorerAddressUrl && (
                <a
                  href={explorerAddressUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-primary hover:underline font-semibold"
                >
                  Open vault in explorer <ExternalLink className="w-3 h-3" />
                </a>
              )}

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
                        Confirmations: <strong>{vaultStatus.lastConfirmedFundingTx.confirmations ?? 0}</strong>
                      </p>
                      <a
                        href={buildExplorerTxUrl(recoveryNetwork, vaultStatus.providerUsed, vaultStatus.lastConfirmedFundingTx.txid)}
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
          ) : (
            <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 text-sm text-orange-700 leading-relaxed">
              Regtest is local-only. For live status, query your own node or local Esplora instance.
            </div>
          )}
        </section>

        {/* Section: Check-In Helper */}
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
                onChange={(event) => setCheckInCadence(Number(event.target.value))}
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

        {/* Section: Broadcast Helper */}
        <section className="space-y-6 print:hidden">
          <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2 print:border-gray-300">
            <Send className="w-5 h-5 text-primary" /> Broadcast Recovery Transaction
          </h2>

          <p className="text-sm text-foreground/70 leading-relaxed">
            Paste a fully signed raw transaction hex from your wallet, then broadcast it to the selected public explorer.
          </p>

          {publicExplorerAvailable ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="raw-transaction-hex" className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
                  Signed Raw Transaction (Hex)
                </label>
                <textarea
                  id="raw-transaction-hex"
                  value={rawTxHex}
                  onChange={(event) => setRawTxHex(event.target.value)}
                  placeholder="020000000001..."
                  className="w-full h-36 bg-muted border border-border rounded-xl p-4 font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {recoveryNetwork === 'mainnet' && (
                <div className="space-y-2">
                  <label htmlFor="mainnet-broadcast-phrase" className="text-[10px] font-bold uppercase tracking-widest text-red-600">
                    Mainnet Confirmation Phrase
                  </label>
                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs font-mono text-red-600">
                    {MAINNET_BROADCAST_CONFIRMATION}
                  </div>
                  <input
                    id="mainnet-broadcast-phrase"
                    type="text"
                    value={broadcastMainnetPhrase}
                    onChange={(event) => setBroadcastMainnetPhrase(event.target.value)}
                    className="w-full bg-muted border border-border rounded-xl p-3 font-mono text-xs focus:ring-2 focus:ring-red-500/20 transition-all"
                    placeholder="Type phrase exactly"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleBroadcastTransaction}
                disabled={
                  isBroadcasting ||
                  rawTxHex.trim().length === 0 ||
                  (recoveryNetwork === 'mainnet' && broadcastMainnetPhrase !== MAINNET_BROADCAST_CONFIRMATION)
                }
                className="btn-primary w-full sm:w-auto !text-sm !px-6 !py-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isBroadcasting ? 'Broadcasting...' : 'Broadcast Transaction'}
              </button>

              {broadcastError && (
                <div role="alert" className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-600 text-sm font-medium">
                  {broadcastError}
                </div>
              )}

              {broadcastResult && (
                <div className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-green-700">
                    Broadcast Accepted ({broadcastResult.providerLabel})
                  </p>
                  <p className="font-mono text-[11px] break-all">{broadcastResult.txid}</p>
                  <a
                    href={broadcastResult.explorerTxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-green-700 hover:underline font-semibold"
                  >
                    Open transaction in explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 text-sm text-orange-700 leading-relaxed">
              Regtest broadcasts require local node RPC (for example, <code>sendrawtransaction</code>).
            </div>
          )}
        </section>

        {/* Section: Technical Data */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-2 print:border-gray-300">Technical Details</h2>
          
          <div className="grid gap-6">
            <DataRow label="Network" value={model.network} />
            <DataRow label="Vault Address" value={model.address} copyable />
            <DataRow label="Beneficiary Pubkey" value={model.beneficiaryPubkey} />
            <DataRow label="Witness Script (Hex)" value={model.witnessScriptHex} copyable mono />
            <DataRow label="Descriptor" value={model.descriptor} copyable mono />
          </div>
        </section>

        {/* Section: Warnings */}
        <section className="p-6 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl space-y-3 print:bg-gray-50 print:border-gray-200">
          <div className="flex items-center gap-2 text-yellow-600 font-bold text-[10px] uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> Strong Warnings
          </div>
          <ul className="text-xs text-foreground/70 space-y-2 print:text-gray-600">
            <li>• <strong>Mistakes are permanent:</strong> If you send funds to the wrong address, they cannot be recovered.</li>
            <li>• <strong>Never share your private keys:</strong> This document does NOT contain your keys, but you need them to claim.</li>
            <li>• <strong>Verify everything:</strong> If using a real Bitcoin (Mainnet), verify the scripts with a second tool first.</li>
          </ul>
        </section>
      </article>

      <footer className="text-center pt-8 border-t border-border print:hidden">
        <p className="text-xs text-foreground/60">Generated by Bitcoin Will • Decentralized Inheritance</p>
      </footer>
    </div>
  );
};

const StatusCard = ({ label, value, detail }: { label: string; value: string; detail: string }) => {
  return (
    <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-xs text-foreground/65 leading-relaxed">{detail}</p>
    </div>
  );
};

const DataRow = ({ label, value, copyable, mono }: { label: string, value: string, copyable?: boolean, mono?: boolean }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 print:text-gray-500">{label}</p>
      <div className="flex gap-2">
        <div className={`flex-1 p-3 bg-muted border border-border rounded-lg text-sm break-all print:bg-transparent print:border-none print:p-0 ${mono ? 'font-mono text-[11px]' : ''}`}>
          {value}
        </div>
        {copyable && (
          <button 
            type="button"
            aria-label={`Copy ${label}`}
            onClick={handleCopy}
            className="p-3 bg-white border border-border rounded-lg hover:bg-muted transition-colors print:hidden"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 opacity-40" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Instructions;
