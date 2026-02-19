import type { FundingEvent, EsploraTx } from './types';
import { toSafeInteger } from './utils';

export const toFundingEvent = (
  tx: EsploraTx,
  address: string,
  tipHeight?: number,
): FundingEvent | null => {
  const txid = typeof tx.txid === 'string' ? tx.txid : '';
  if (!/^[a-f0-9]{64}$/i.test(txid)) return null;

  const fundedAmountSats = (tx.vout ?? [])
    .filter((vout) => vout.scriptpubkey_address === address)
    .reduce((sum, vout) => sum + toSafeInteger(vout.value), 0);

  if (fundedAmountSats <= 0) return null;

  const confirmed = Boolean(tx.status?.confirmed);
  const blockHeight = toSafeInteger(tx.status?.block_height);
  const blockTime = toSafeInteger(tx.status?.block_time);

  const confirmations =
    confirmed && tipHeight !== undefined && blockHeight > 0 ? Math.max(0, tipHeight - blockHeight + 1) : undefined;

  return {
    txid: txid.toLowerCase(),
    fundedAmountSats,
    confirmed,
    blockHeight: blockHeight > 0 ? blockHeight : undefined,
    blockTime: blockTime > 0 ? blockTime : undefined,
    confirmations,
  };
};

export const getFundingEvents = (
  txs: EsploraTx[],
  address: string,
  tipHeight?: number,
): FundingEvent[] =>
  txs
    .map((tx) => toFundingEvent(tx, address, tipHeight))
    .filter((event): event is FundingEvent => event !== null);

export const getOldestConfirmedTxid = (txs: EsploraTx[]): string | null => {
  for (let index = txs.length - 1; index >= 0; index -= 1) {
    const tx = txs[index];
    if (!tx.status?.confirmed) continue;
    if (typeof tx.txid !== 'string') continue;
    if (!/^[a-f0-9]{64}$/i.test(tx.txid)) continue;
    return tx.txid.toLowerCase();
  }
  return null;
};
