import { BitcoinNetwork } from './types';

export const EXPLORER_PROVIDERS = ['mempool', 'blockstream'] as const;
export type ExplorerProvider = (typeof EXPLORER_PROVIDERS)[number];

const DEFAULT_TIMEOUT_MS = 10_000;

interface ExplorerConfig {
  apiBaseUrl: string;
  explorerBaseUrl: string;
  providerLabel: string;
}

const EXPLORER_CONFIG: Record<
  Exclude<BitcoinNetwork, 'regtest'>,
  Record<ExplorerProvider, ExplorerConfig>
> = {
  mainnet: {
    mempool: {
      apiBaseUrl: 'https://mempool.space/api',
      explorerBaseUrl: 'https://mempool.space',
      providerLabel: 'Mempool.space',
    },
    blockstream: {
      apiBaseUrl: 'https://blockstream.info/api',
      explorerBaseUrl: 'https://blockstream.info',
      providerLabel: 'Blockstream.info',
    },
  },
  testnet: {
    mempool: {
      apiBaseUrl: 'https://mempool.space/testnet/api',
      explorerBaseUrl: 'https://mempool.space/testnet',
      providerLabel: 'Mempool.space (Testnet)',
    },
    blockstream: {
      apiBaseUrl: 'https://blockstream.info/testnet/api',
      explorerBaseUrl: 'https://blockstream.info/testnet',
      providerLabel: 'Blockstream.info (Testnet)',
    },
  },
};

interface EsploraAddressStats {
  funded_txo_sum?: number;
  spent_txo_sum?: number;
  tx_count?: number;
}

interface EsploraAddressResponse {
  chain_stats?: EsploraAddressStats;
  mempool_stats?: EsploraAddressStats;
}

interface EsploraTxStatus {
  confirmed?: boolean;
  block_height?: number;
  block_time?: number;
}

interface EsploraTxVout {
  scriptpubkey_address?: string;
  value?: number;
}

interface EsploraTx {
  txid?: string;
  status?: EsploraTxStatus;
  vout?: EsploraTxVout[];
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

const isExplorerProvider = (value: unknown): value is ExplorerProvider =>
  typeof value === 'string' && (EXPLORER_PROVIDERS as readonly string[]).includes(value);

function assertPublicExplorerNetwork(
  network: BitcoinNetwork,
): asserts network is Exclude<BitcoinNetwork, 'regtest'> {
  if (network === 'regtest') {
    throw new Error('Public explorer APIs are not available for Regtest. Use a local node or local Esplora instance.');
  }
}

const getExplorerConfig = (network: BitcoinNetwork, provider: ExplorerProvider): ExplorerConfig => {
  assertPublicExplorerNetwork(network);
  return EXPLORER_CONFIG[network][provider];
};

const getProviderOrder = (preferred: ExplorerProvider, useFallback: boolean): ExplorerProvider[] => {
  if (!useFallback) return [preferred];
  const secondary = preferred === 'mempool' ? 'blockstream' : 'mempool';
  return [preferred, secondary];
};

const getTimeoutMs = (timeoutMs?: number): number =>
  Number.isFinite(timeoutMs) && (timeoutMs as number) > 0 ? (timeoutMs as number) : DEFAULT_TIMEOUT_MS;

const sanitizeAddress = (address: string): string => {
  const normalized = address.trim();
  if (normalized.length < 14) {
    throw new Error('Address is too short to query.');
  }
  return normalized;
};

const sanitizeRawTxHex = (rawTxHex: string): string => {
  const normalized = rawTxHex.trim().toLowerCase();
  if (normalized.length === 0) {
    throw new Error('Transaction hex is required.');
  }
  if (!/^[a-f0-9]+$/.test(normalized)) {
    throw new Error('Transaction hex must contain only hexadecimal characters (0-9, a-f).');
  }
  if (normalized.length % 2 !== 0) {
    throw new Error('Transaction hex must have an even number of characters.');
  }
  if (normalized.length < 20) {
    throw new Error('Transaction hex is too short to be valid.');
  }
  return normalized;
};

const toSafeInteger = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.trunc(value);
};

const parseTipHeight = (value: string): number | undefined => {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const extractErrorMessage = async (response: Response): Promise<string> => {
  const body = await response.text().catch(() => '');
  const normalized = body.trim();
  if (normalized.length > 0) {
    return normalized.slice(0, 300);
  }
  return `${response.status} ${response.statusText}`.trim();
};

const fetchJsonWithTimeout = async <T>(
  url: string,
  fetcher: typeof fetch,
  timeoutMs: number,
): Promise<T> => {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }
    return (await response.json()) as T;
  } finally {
    globalThis.clearTimeout(timer);
  }
};

const fetchTextWithTimeout = async (
  url: string,
  fetcher: typeof fetch,
  timeoutMs: number,
  init?: RequestInit,
): Promise<string> => {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }
    return await response.text();
  } finally {
    globalThis.clearTimeout(timer);
  }
};

const toFundingEvent = (
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
    confirmed && tipHeight && blockHeight > 0 ? Math.max(0, tipHeight - blockHeight + 1) : confirmed ? 0 : undefined;

  return {
    txid: txid.toLowerCase(),
    fundedAmountSats,
    confirmed,
    blockHeight: blockHeight > 0 ? blockHeight : undefined,
    blockTime: blockTime > 0 ? blockTime : undefined,
    confirmations,
  };
};

const fetchAddressSummaryWithProvider = async (
  request: Required<Pick<AddressSummaryRequest, 'network' | 'address' | 'provider' | 'timeoutMs' | 'fetcher'>>,
): Promise<AddressSummary> => {
  const config = getExplorerConfig(request.network, request.provider);
  const encodedAddress = encodeURIComponent(request.address);

  const [addressData, txs, tipHeightRaw] = await Promise.all([
    fetchJsonWithTimeout<EsploraAddressResponse>(
      `${config.apiBaseUrl}/address/${encodedAddress}`,
      request.fetcher,
      request.timeoutMs,
    ),
    fetchJsonWithTimeout<EsploraTx[]>(
      `${config.apiBaseUrl}/address/${encodedAddress}/txs`,
      request.fetcher,
      request.timeoutMs,
    ),
    fetchTextWithTimeout(
      `${config.apiBaseUrl}/blocks/tip/height`,
      request.fetcher,
      request.timeoutMs,
    ),
  ]);

  const chainFunded = toSafeInteger(addressData.chain_stats?.funded_txo_sum);
  const chainSpent = toSafeInteger(addressData.chain_stats?.spent_txo_sum);
  const mempoolFunded = toSafeInteger(addressData.mempool_stats?.funded_txo_sum);
  const mempoolSpent = toSafeInteger(addressData.mempool_stats?.spent_txo_sum);
  const txCount = toSafeInteger(addressData.chain_stats?.tx_count) + toSafeInteger(addressData.mempool_stats?.tx_count);
  const tipHeight = parseTipHeight(tipHeightRaw);

  const fundingEvents = (Array.isArray(txs) ? txs : [])
    .map((tx) => toFundingEvent(tx, request.address, tipHeight))
    .filter((event): event is FundingEvent => event !== null);

  const lastFundingTx = fundingEvents[0];
  const lastConfirmedFundingTx = fundingEvents.find((event) => event.confirmed);

  return {
    network: request.network,
    address: request.address,
    providerUsed: request.provider,
    providerLabel: config.providerLabel,
    usedFallbackProvider: false,
    confirmedBalanceSats: chainFunded - chainSpent,
    unconfirmedBalanceSats: mempoolFunded - mempoolSpent,
    totalBalanceSats: chainFunded - chainSpent + (mempoolFunded - mempoolSpent),
    txCount,
    tipHeight,
    lastFundingTx,
    lastConfirmedFundingTx,
    fetchedAt: new Date().toISOString(),
  };
};

export const supportsPublicExplorerNetwork = (network: BitcoinNetwork): boolean =>
  network === 'mainnet' || network === 'testnet';

export const buildExplorerAddressUrl = (
  network: BitcoinNetwork,
  provider: ExplorerProvider,
  address: string,
): string => {
  const config = getExplorerConfig(network, provider);
  return `${config.explorerBaseUrl}/address/${encodeURIComponent(sanitizeAddress(address))}`;
};

export const buildExplorerTxUrl = (
  network: BitcoinNetwork,
  provider: ExplorerProvider,
  txid: string,
): string => {
  const config = getExplorerConfig(network, provider);
  return `${config.explorerBaseUrl}/tx/${encodeURIComponent(txid.trim())}`;
};

export const formatSats = (sats: number): string =>
  new Intl.NumberFormat('en-US').format(Math.trunc(sats));

export const formatBtc = (sats: number): string =>
  (sats / 100_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });

export const fetchAddressSummary = async ({
  network,
  address,
  provider = 'mempool',
  fallbackToOtherProvider = true,
  timeoutMs,
  fetcher = fetch,
}: AddressSummaryRequest): Promise<AddressSummary> => {
  assertPublicExplorerNetwork(network);
  if (!isExplorerProvider(provider)) {
    throw new Error('Unsupported explorer provider.');
  }

  const normalizedAddress = sanitizeAddress(address);
  const requestTimeoutMs = getTimeoutMs(timeoutMs);
  const providerOrder = getProviderOrder(provider, fallbackToOtherProvider);

  let lastError: Error | null = null;
  for (let index = 0; index < providerOrder.length; index += 1) {
    const providerCandidate = providerOrder[index];
    try {
      const summary = await fetchAddressSummaryWithProvider({
        network,
        address: normalizedAddress,
        provider: providerCandidate,
        timeoutMs: requestTimeoutMs,
        fetcher,
      });
      return {
        ...summary,
        usedFallbackProvider: index > 0,
      };
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw new Error(
    `Unable to fetch address data from public explorers. ${lastError?.message ?? 'Unknown network error.'}`,
  );
};

const broadcastWithProvider = async (
  request: Required<Pick<BroadcastTransactionRequest, 'network' | 'provider' | 'rawTxHex' | 'timeoutMs' | 'fetcher'>>,
): Promise<BroadcastTransactionResult> => {
  const config = getExplorerConfig(request.network, request.provider);
  const txid = (await fetchTextWithTimeout(
    `${config.apiBaseUrl}/tx`,
    request.fetcher,
    request.timeoutMs,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: request.rawTxHex,
    },
  )).trim();

  if (!/^[a-f0-9]{64}$/i.test(txid)) {
    throw new Error('Explorer response did not include a valid txid.');
  }

  return {
    txid: txid.toLowerCase(),
    network: request.network,
    providerUsed: request.provider,
    providerLabel: config.providerLabel,
    usedFallbackProvider: false,
    explorerTxUrl: buildExplorerTxUrl(request.network, request.provider, txid),
  };
};

export const broadcastTransaction = async ({
  network,
  rawTxHex,
  provider = 'mempool',
  fallbackToOtherProvider = true,
  timeoutMs,
  fetcher = fetch,
}: BroadcastTransactionRequest): Promise<BroadcastTransactionResult> => {
  assertPublicExplorerNetwork(network);
  if (!isExplorerProvider(provider)) {
    throw new Error('Unsupported explorer provider.');
  }

  const normalizedTxHex = sanitizeRawTxHex(rawTxHex);
  const requestTimeoutMs = getTimeoutMs(timeoutMs);
  const providerOrder = getProviderOrder(provider, fallbackToOtherProvider);

  let lastError: Error | null = null;
  for (let index = 0; index < providerOrder.length; index += 1) {
    const providerCandidate = providerOrder[index];
    try {
      const result = await broadcastWithProvider({
        network,
        rawTxHex: normalizedTxHex,
        provider: providerCandidate,
        timeoutMs: requestTimeoutMs,
        fetcher,
      });
      return {
        ...result,
        usedFallbackProvider: index > 0,
      };
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw new Error(
    `Unable to broadcast transaction using public explorers. ${lastError?.message ?? 'Unknown network error.'}`,
  );
};
