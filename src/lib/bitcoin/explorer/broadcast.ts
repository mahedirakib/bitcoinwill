import type { BroadcastTransactionRequest, BroadcastTransactionResult } from './types';
import { isExplorerProvider, assertPublicExplorerNetwork, getProviderOrder, getExplorerConfig } from './config';
import { getTimeoutMs, sanitizeRawTxHex } from './utils';
import { fetchTextWithTimeout } from './http';
import { buildExplorerTxUrl } from './urls';

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
