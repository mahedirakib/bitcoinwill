import { Transaction } from 'bitcoinjs-lib';
import '../init';
import type { BroadcastTransactionRequest, BroadcastTransactionResult } from './types';
import { isExplorerProvider, assertPublicExplorerNetwork, getProviderOrder, getExplorerConfig } from './config';
import { getTimeoutMs, sanitizeRawTxHex } from './utils';
import { fetchTextWithTimeout } from './http';
import { buildExplorerTxUrl } from './urls';

const computeTxid = (rawTxHex: string): string => {
  // Transaction.fromHex parses the raw tx and also structurally validates it;
  // an invalid tx throws here so we surface a clear error before hitting the
  // network. getId() returns the canonical little-endian-reversed sha256^2
  // txid (lowercase hex), matching what explorers return.
  return Transaction.fromHex(rawTxHex).getId();
};

const broadcastWithProvider = async (
  request: Required<Pick<BroadcastTransactionRequest, 'network' | 'provider' | 'rawTxHex' | 'timeoutMs' | 'fetcher'>> &
    Pick<BroadcastTransactionRequest, 'retryConfig'> & { expectedTxid: string },
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
    request.retryConfig,
  )).trim();

  if (!/^[a-f0-9]{64}$/i.test(txid)) {
    throw new Error('Explorer response did not include a valid txid.');
  }

  const normalizedTxid = txid.toLowerCase();
  // Verify the explorer-returned txid matches the txid computed locally from
  // the broadcast hex. A mismatch indicates a buggy/malicious explorer or a
  // man-in-the-middle; without this check the user could be told the broadcast
  // succeeded with txid X when it actually broadcast as Y (or not at all).
  if (normalizedTxid !== request.expectedTxid) {
    throw new Error('Explorer returned a txid that does not match the broadcast transaction.');
  }

  return {
    txid: normalizedTxid,
    network: request.network,
    providerUsed: request.provider,
    providerLabel: config.providerLabel,
    usedFallbackProvider: false,
    explorerTxUrl: buildExplorerTxUrl(request.network, request.provider, normalizedTxid),
  };
};

export const broadcastTransaction = async ({
  network,
  rawTxHex,
  provider = 'mempool',
  fallbackToOtherProvider = true,
  timeoutMs,
  fetcher = fetch,
  retryConfig,
}: BroadcastTransactionRequest): Promise<BroadcastTransactionResult> => {
  assertPublicExplorerNetwork(network);
  if (!isExplorerProvider(provider)) {
    throw new Error('Unsupported explorer provider.');
  }

  const normalizedTxHex = sanitizeRawTxHex(rawTxHex);
  // Compute the canonical txid once, before trying providers, so every
  // provider attempt can be verified against it. This also structurally
  // validates the tx hex (catches malformed input early).
  let expectedTxid: string;
  try {
    expectedTxid = computeTxid(normalizedTxHex);
  } catch {
    throw new Error('Transaction hex could not be parsed as a valid Bitcoin transaction.');
  }

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
        retryConfig,
        expectedTxid,
      });
      return {
        ...result,
        usedFallbackProvider: index > 0,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `Unable to broadcast transaction using public explorers. ${lastError?.message ?? 'Unknown network error.'}`,
  );
};
