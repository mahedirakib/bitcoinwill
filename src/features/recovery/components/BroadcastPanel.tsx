import { CheckCircle2, ExternalLink, Key, Send, AlertTriangle, RotateCcw } from 'lucide-react';
import type { BroadcastPanelProps } from '../types';

const MAINNET_BROADCAST_CONFIRMATION = 'I UNDERSTAND THIS BROADCASTS ON MAINNET';

export const BroadcastPanel = ({
  model,
  rawTxHex,
  onRawTxHexChange,
  broadcastResult,
  broadcastError,
  isBroadcasting,
  broadcastMainnetPhrase,
  onBroadcastMainnetPhraseChange,
  onBroadcast,
  reconstructedKey,
}: BroadcastPanelProps) => {
  const isMainnet = model.network === 'mainnet';
  const trimmedHex = rawTxHex.trim();
  // Validate up-front so the button isn't enabled for obviously-invalid input
  // (e.g. pasted prose). This mirrors sanitizeRawTxHex without throwing.
  const looksLikeRawTxHex =
    trimmedHex.length >= 20 &&
    trimmedHex.length % 2 === 0 &&
    /^[0-9a-fA-F]+$/.test(trimmedHex);
  const canBroadcast =
    looksLikeRawTxHex &&
    (!isMainnet || broadcastMainnetPhrase === MAINNET_BROADCAST_CONFIRMATION);

  return (
    <section className="space-y-4 print:hidden">
      <h2 className="flex items-center gap-2 border-b border-border pb-2 text-base font-semibold print:border-gray-300">
        <Send className="h-4 w-4 text-foreground/70" /> Broadcast recovery transaction
      </h2>

      {reconstructedKey && (
        <div className="rounded-md border border-success/20 bg-success-bg p-3 space-y-2">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-semibold">Private key reconstructed</span>
          </div>
          <p className="text-sm leading-relaxed text-success">
            You have successfully combined your shares. Use the reconstructed private key in a wallet like Sparrow to create and sign the recovery transaction, then paste the signed transaction hex below.
          </p>
          <div className="flex items-center gap-2 rounded border border-border bg-white px-3 py-2">
            <Key className="h-3.5 w-3.5 text-success" />
            <span className="font-mono text-xs text-muted-foreground">
              {reconstructedKey.slice(0, 16)}…{reconstructedKey.slice(-16)}
            </span>
          </div>
        </div>
      )}

      <p className="text-sm leading-relaxed text-muted-foreground">
        Paste a fully signed raw transaction hex from your wallet, then broadcast it to the selected public explorer.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="raw-transaction-hex" className="field-label">
          Signed raw transaction (hex)
        </label>
        <textarea
          id="raw-transaction-hex"
          value={rawTxHex}
          onChange={(event) => onRawTxHexChange(event.target.value)}
          placeholder="020000000001…"
          className="field-input h-36 resize-none"
        />
      </div>

      {isMainnet && (
        <div className="space-y-1.5">
          <label htmlFor="mainnet-broadcast-phrase" className="field-label text-danger">
            Mainnet confirmation phrase
          </label>
          <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 font-mono text-xs text-danger">
            {MAINNET_BROADCAST_CONFIRMATION}
          </div>
          <input
            id="mainnet-broadcast-phrase"
            type="text"
            value={broadcastMainnetPhrase}
            onChange={(event) => onBroadcastMainnetPhraseChange(event.target.value)}
            className="field-input"
            placeholder="Type phrase exactly"
          />
        </div>
      )}

      <button
        type="button"
        onClick={onBroadcast}
        disabled={isBroadcasting || !canBroadcast}
        className={isMainnet ? 'btn-danger' : 'btn-primary'}
      >
        {isBroadcasting ? 'Broadcasting…' : 'Broadcast transaction'}
      </button>

      {broadcastError && (
        <div className="space-y-3">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger/5 p-3 text-sm text-danger"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Broadcast failed</p>
              <p className="text-xs text-danger/80 mt-1">{broadcastError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBroadcast}
            disabled={isBroadcasting || !canBroadcast}
            className="btn-secondary w-full"
          >
            <RotateCcw className={`h-4 w-4 ${isBroadcasting ? 'animate-spin' : ''}`} />
            {isBroadcasting ? 'Retrying…' : 'Retry broadcast'}
          </button>
        </div>
      )}

      {broadcastResult && (
        <div className="rounded-md border border-success/20 bg-success-bg p-3 space-y-1.5">
          <p className="section-eyebrow text-success">
            Broadcast accepted ({broadcastResult.providerLabel})
          </p>
          <p className="break-all font-mono text-[11px] text-foreground">
            {broadcastResult.txid}
          </p>
          <a
            href={broadcastResult.explorerTxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-2 hover:text-foreground/70"
          >
            Open transaction in explorer <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </section>
  );
};
