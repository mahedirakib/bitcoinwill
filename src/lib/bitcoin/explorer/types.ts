import type { BitcoinNetwork } from '../types';

export const EXPLORER_PROVIDERS = ['mempool', 'blockstream'] as const;
export type ExplorerProvider = (typeof EXPLORER_PROVIDERS)[number];

export interface ExplorerConfig {
  apiBaseUrl: string;
  explorerBaseUrl: string;
  providerLabel: string;
}

export interface FundingEvent {
  txid: string;
  fundedAmountSats: number;
  confirmed: boolean;
  blockHeight?: number;
  blockTime?: number;
  confirmations?: number;
}

export interface AddressSummary {
  network: BitcoinNetwork;
  address: string;
  providerUsed: ExplorerProvider;
  providerLabel: string;
  usedFallbackProvider: boolean;
  confirmedBalanceSats: number;
  unconfirmedBalanceSats: number;
  totalBalanceSats: number;
  txCount: number;
  tipHeight?: number;
  lastFundingTx?: FundingEvent;
  lastConfirmedFundingTx?: FundingEvent;
  fetchedAt: string;
}

export interface AddressSummaryRequest {
  network: BitcoinNetwork;
  address: string;
  provider?: ExplorerProvider;
  fallbackToOtherProvider?: boolean;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

export interface BroadcastTransactionRequest {
  network: BitcoinNetwork;
  rawTxHex: string;
  provider?: ExplorerProvider;
  fallbackToOtherProvider?: boolean;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

export interface BroadcastTransactionResult {
  txid: string;
  network: BitcoinNetwork;
  providerUsed: ExplorerProvider;
  providerLabel: string;
  usedFallbackProvider: boolean;
  explorerTxUrl: string;
}

export interface EsploraAddressStats {
  funded_txo_sum?: number;
  spent_txo_sum?: number;
  tx_count?: number;
}

export interface EsploraAddressResponse {
  chain_stats?: EsploraAddressStats;
  mempool_stats?: EsploraAddressStats;
}

export interface EsploraTxStatus {
  confirmed?: boolean;
  block_height?: number;
  block_time?: number;
}

export interface EsploraTxVout {
  scriptpubkey_address?: string;
  value?: number;
}

export interface EsploraTx {
  txid?: string;
  status?: EsploraTxStatus;
  vout?: EsploraTxVout[];
}
