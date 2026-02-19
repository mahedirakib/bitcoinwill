import type { BitcoinNetwork } from '../types';
import type { ExplorerProvider } from './types';
import { getExplorerConfig } from './config';
import { sanitizeAddress } from './utils';

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
