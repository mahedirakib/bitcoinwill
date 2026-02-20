import { Send, ExternalLink, Key, CheckCircle2 } from 'lucide-react';
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
  const isMainnet = model.network === 'MAINNET';
  const canBroadcast = 
    rawTxHex.trim().length > 0 &&
    (!isMainnet || broadcastMainnetPhrase === MAINNET_BROADCAST_CONFIRMATION);

  return (
    <section className="space-y-6 print:hidden">
      <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2 print:border-gray-300">
        <Send className="w-5 h-5 text-primary" /> Broadcast Recovery Transaction
      </h2>

      {reconstructedKey && (
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold">Private Key Reconstructed</span>
          </div>
          <p className="text-sm text-green-600/80">
            You have successfully combined your shares. Use the reconstructed private key 
            in a wallet like Sparrow to create and sign the recovery transaction, then paste 
            the signed transaction hex below.
          </p>
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-500/20">
            <Key className="w-4 h-4 text-green-600" />
            <span className="text-xs font-mono text-foreground/60">
              {reconstructedKey.slice(0, 16)}...{reconstructedKey.slice(-16)}
            </span>
          </div>
        </div>
      )}

      <p className="text-sm text-foreground/70 leading-relaxed">
        Paste a fully signed raw transaction hex from your wallet, then broadcast it to the selected public explorer.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="raw-transaction-hex" className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
            Signed Raw Transaction (Hex)
          </label>
          <textarea
            id="raw-transaction-hex"
            value={rawTxHex}
            onChange={(event) => onRawTxHexChange(event.target.value)}
            placeholder="020000000001..."
            className="w-full h-36 bg-muted border border-border rounded-xl p-4 font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {isMainnet && (
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
              onChange={(event) => onBroadcastMainnetPhraseChange(event.target.value)}
              className="w-full bg-muted border border-border rounded-xl p-3 font-mono text-xs focus:ring-2 focus:ring-red-500/20 transition-all"
              placeholder="Type phrase exactly"
            />
          </div>
        )}

        <button
          type="button"
          onClick={onBroadcast}
          disabled={isBroadcasting || !canBroadcast}
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
    </section>
  );
};
