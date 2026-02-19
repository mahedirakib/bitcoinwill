import type { AddressSummary, AddressSummaryRequest, EsploraAddressResponse, EsploraTx } from './types';
import { getExplorerConfig, getProviderOrder, ESPLORA_CHAIN_PAGE_SIZE, ESPLORA_CHAIN_SCAN_PAGE_LIMIT, isExplorerProvider, assertPublicExplorerNetwork } from './config';
import { getTimeoutMs, sanitizeAddress, toSafeInteger, parseTipHeight } from './utils';
import { fetchJsonWithTimeout, fetchTextWithTimeout } from './http';
import { getFundingEvents, getOldestConfirmedTxid } from './parsers';

const fetchAddressSummaryWithProvider = async (
  request: Required<Pick<AddressSummaryRequest, 'network' | 'address' | 'provider' | 'timeoutMs' | 'fetcher'>>,
): Promise<AddressSummary> => {
  const config = getExplorerConfig(request.network, request.provider);
  const encodedAddress = encodeURIComponent(request.address);

  const [addressData, txsRaw, tipHeightRaw] = await Promise.all([
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
  const txs = Array.isArray(txsRaw) ? txsRaw : [];

  const fundingEvents = getFundingEvents(txs, request.address, tipHeight);
  let lastFundingTx = fundingEvents[0];
  let lastConfirmedFundingTx = fundingEvents.find((event) => event.confirmed);

  if (!lastFundingTx || !lastConfirmedFundingTx) {
    let pagesScanned = 0;
    let lastSeenTxid = getOldestConfirmedTxid(txs);

    while (
      lastSeenTxid &&
      pagesScanned < ESPLORA_CHAIN_SCAN_PAGE_LIMIT &&
      (!lastFundingTx || !lastConfirmedFundingTx)
    ) {
      const olderTxsRaw = await fetchJsonWithTimeout<EsploraTx[]>(
        `${config.apiBaseUrl}/address/${encodedAddress}/txs/chain/${lastSeenTxid}`,
        request.fetcher,
        request.timeoutMs,
      );
      const olderTxs = Array.isArray(olderTxsRaw) ? olderTxsRaw : [];
      if (olderTxs.length === 0) break;

      const olderFundingEvents = getFundingEvents(olderTxs, request.address, tipHeight);
      if (!lastFundingTx && olderFundingEvents[0]) {
        lastFundingTx = olderFundingEvents[0];
      }
      if (!lastConfirmedFundingTx) {
        lastConfirmedFundingTx = olderFundingEvents.find((event) => event.confirmed);
      }

      pagesScanned += 1;
      const nextLastSeenTxid = getOldestConfirmedTxid(olderTxs);
      if (
        !nextLastSeenTxid ||
        nextLastSeenTxid === lastSeenTxid ||
        olderTxs.length < ESPLORA_CHAIN_PAGE_SIZE
      ) {
        break;
      }
      lastSeenTxid = nextLastSeenTxid;
    }
  }

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
