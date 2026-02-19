import type { BitcoinNetwork } from '../types';
import type { ExplorerConfig, ExplorerProvider } from './types';

export const EXPLORER_CONFIG: Record<
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

export const DEFAULT_TIMEOUT_MS = 10_000;
export const ESPLORA_CHAIN_PAGE_SIZE = 25;
export const ESPLORA_CHAIN_SCAN_PAGE_LIMIT = 20;

export const isExplorerProvider = (value: unknown): value is ExplorerProvider =>
  typeof value === 'string' && (['mempool', 'blockstream'] as readonly string[]).includes(value);

export function assertPublicExplorerNetwork(
  network: BitcoinNetwork,
): asserts network is Exclude<BitcoinNetwork, 'regtest'> {
  if (network === 'regtest') {
    throw new Error('Public explorer APIs are not available for Regtest. Use a local node or local Esplora instance.');
  }
}

export const getExplorerConfig = (network: BitcoinNetwork, provider: ExplorerProvider): ExplorerConfig => {
  assertPublicExplorerNetwork(network);
  return EXPLORER_CONFIG[network][provider];
};

export const getProviderOrder = (preferred: ExplorerProvider, useFallback: boolean): ExplorerProvider[] => {
  if (!useFallback) return [preferred];
  const secondary = preferred === 'mempool' ? 'blockstream' : 'mempool';
  return [preferred, secondary];
};

export const supportsPublicExplorerNetwork = (network: BitcoinNetwork): boolean =>
  network === 'mainnet' || network === 'testnet';
