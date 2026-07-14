import { address as bitcoinAddress, Transaction } from 'bitcoinjs-lib';
import '../init';
import type { BroadcastTransactionRequest, BroadcastTransactionResult, EsploraTx, VaultSpendContext } from './types';
import { isExplorerProvider, assertPublicExplorerNetwork, getProviderOrder, getExplorerConfig } from './config';
import { getTimeoutMs, sanitizeAddress, sanitizeRawTxHex } from './utils';
import { fetchJsonWithTimeout, fetchTextWithTimeout } from './http';
import { buildExplorerTxUrl } from './urls';
import { bytesToHex } from '../hex';
import { getNetworkParams } from '../network';

const MAX_ABSOLUTE_FEE_SATS = 1_000_000;
const MAX_FEE_RATE_SATS_PER_VBYTE = 500;

interface VaultTransactionInspection {
  feeSats: number;
  feeRateSatsPerVbyte: number;
  vaultInputCount: number;
}

const inputTxid = (hash: Uint8Array): string => bytesToHex(Uint8Array.from(hash).reverse());

const witnessMatchesVault = (
  witness: Uint8Array[],
  vault: VaultSpendContext,
): boolean => {
  const expectedScript = vault.witnessScriptHex.toLowerCase();
  if (vault.addressType === 'p2wsh') {
    return witness.length >= 3 &&
      witness[witness.length - 2].length === 0 &&
      bytesToHex(witness[witness.length - 1]) === expectedScript;
  }

  return Boolean(vault.taprootControlBlock) &&
    witness.length >= 4 &&
    witness[witness.length - 3].length === 0 &&
    bytesToHex(witness[witness.length - 2]) === expectedScript &&
    bytesToHex(witness[witness.length - 1]) === vault.taprootControlBlock?.toLowerCase();
};

const sequenceSatisfiesCsv = (sequence: number, locktimeBlocks: number): boolean =>
  (sequence & 0x80000000) === 0 &&
  (sequence & 0x00400000) === 0 &&
  (sequence & 0xffff) >= locktimeBlocks;

const fetchPrevTransactions = async (
  transaction: Transaction,
  request: Required<Pick<BroadcastTransactionRequest, 'network' | 'provider' | 'timeoutMs' | 'fetcher'>> &
    Pick<BroadcastTransactionRequest, 'retryConfig'>,
): Promise<Map<string, EsploraTx>> => {
  const txids = [...new Set(transaction.ins.map((input) => inputTxid(input.hash)))];
  const providerOrder = getProviderOrder(request.provider, true);
  let lastError: Error | null = null;

  for (const provider of providerOrder) {
    try {
      const config = getExplorerConfig(request.network, provider);
      const transactions = await Promise.all(txids.map(async (txid) => {
        const previous = await fetchJsonWithTimeout<EsploraTx>(
          `${config.apiBaseUrl}/tx/${txid}`,
          request.fetcher,
          request.timeoutMs,
          request.retryConfig,
        );
        return [txid, previous] as const;
      }));
      return new Map(transactions);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(`Unable to inspect transaction inputs. ${lastError?.message ?? 'Unknown explorer error.'}`);
};

export const inspectVaultTransaction = async (
  rawTxHex: string,
  vault: VaultSpendContext,
  request: Required<Pick<BroadcastTransactionRequest, 'network' | 'provider' | 'timeoutMs' | 'fetcher'>> &
    Pick<BroadcastTransactionRequest, 'retryConfig'>,
): Promise<VaultTransactionInspection> => {
  const transaction = Transaction.fromHex(rawTxHex);
  if (transaction.ins.length === 0 || transaction.outs.length === 0) {
    throw new Error('Transaction must contain at least one input and one output.');
  }
  if (transaction.version < 2) {
    throw new Error('Beneficiary recovery transactions must use transaction version 2 or later.');
  }

  const previousTransactions = await fetchPrevTransactions(transaction, request);
  let totalInputSats = 0n;
  let vaultInputCount = 0;

  transaction.ins.forEach((input) => {
    const txid = inputTxid(input.hash);
    const previousOutput = previousTransactions.get(txid)?.vout?.[input.index];
    const previousValue = previousOutput?.value;
    if (!previousOutput || !Number.isSafeInteger(previousValue) || (previousValue ?? -1) < 0) {
      throw new Error(`Explorer did not return a valid previous output for ${txid}:${input.index}.`);
    }
    totalInputSats += BigInt(previousValue as number);

    if (previousOutput.scriptpubkey_address !== vault.address) return;
    vaultInputCount += 1;
    if (!sequenceSatisfiesCsv(input.sequence, vault.locktimeBlocks)) {
      throw new Error(`Vault input ${txid}:${input.index} does not satisfy the required CSV sequence.`);
    }
    if (!witnessMatchesVault(input.witness, vault)) {
      throw new Error(`Vault input ${txid}:${input.index} does not use the expected beneficiary witness path.`);
    }
  });

  if (vaultInputCount === 0) {
    throw new Error('Transaction does not spend any output from the loaded vault.');
  }

  const destinationAddress = sanitizeAddress(vault.destinationAddress, request.network);
  const destinationScript = bitcoinAddress.toOutputScript(
    destinationAddress,
    getNetworkParams(request.network),
  );
  if (!transaction.outs.some((output) => bytesToHex(output.script) === bytesToHex(destinationScript))) {
    throw new Error('Transaction does not pay the confirmed destination address.');
  }

  const totalOutputSats = transaction.outs.reduce((sum, output) => sum + output.value, 0n);
  const fee = totalInputSats - totalOutputSats;
  if (fee < 0n || fee > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Transaction outputs exceed inputs or the fee cannot be represented safely.');
  }
  const feeSats = Number(fee);
  const feeRateSatsPerVbyte = feeSats / transaction.virtualSize();
  if (feeSats > MAX_ABSOLUTE_FEE_SATS || feeRateSatsPerVbyte > MAX_FEE_RATE_SATS_PER_VBYTE) {
    throw new Error(
      `Transaction fee is too high (${feeSats} sats, ${feeRateSatsPerVbyte.toFixed(1)} sat/vB).`,
    );
  }

  return { feeSats, feeRateSatsPerVbyte, vaultInputCount };
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
  vault,
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
    const transaction = Transaction.fromHex(normalizedTxHex);
    if (transaction.ins.length === 0 || transaction.outs.length === 0) {
      throw new Error('empty transaction');
    }
    expectedTxid = transaction.getId();
  } catch {
    throw new Error('Transaction hex must contain a valid Bitcoin transaction with at least one input and one output.');
  }

  const requestTimeoutMs = getTimeoutMs(timeoutMs);
  const providerOrder = getProviderOrder(provider, fallbackToOtherProvider);
  const inspection = vault
    ? await inspectVaultTransaction(normalizedTxHex, vault, {
      network,
      provider,
      timeoutMs: requestTimeoutMs,
      fetcher,
      retryConfig,
    })
    : undefined;

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
        ...inspection,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(
    `Unable to broadcast transaction using public explorers. ${lastError?.message ?? 'Unknown network error.'}`,
  );
};
