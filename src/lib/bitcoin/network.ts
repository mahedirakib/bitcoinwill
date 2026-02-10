import { networks, Network } from 'bitcoinjs-lib';
import { BitcoinNetwork } from './types';

/**
 * Maps Bitcoin Will network names to bitcoinjs-lib network parameters.
 * 
 * Converts our application's network identifiers ('testnet', 'regtest', 'mainnet')
 * to the corresponding bitcoinjs-lib Network objects needed for address generation
 * and transaction construction.
 * 
 * Note: Mainnet uses the standard bitcoinjs-lib networks.bitcoin directly,
 * so this function is primarily for testnet/regtest conversion.
 * 
 * @param {BitcoinNetwork} network - The network identifier from our app
 * @returns {Network} The bitcoinjs-lib Network configuration object
 * 
 * @example
 * const networkParams = getNetworkParams('testnet');
 * // Returns bitcoinjs-lib testnet network configuration
 * 
 * const networkParams = getNetworkParams('regtest');
 * // Returns bitcoinjs-lib regtest network configuration
 */
export const getNetworkParams = (network: BitcoinNetwork): Network => {
  switch (network) {
    case 'mainnet':
      return networks.bitcoin;
    case 'regtest':
      return networks.regtest;
    case 'testnet':
      return networks.testnet;
    default:
      throw new Error(`Unsupported Bitcoin network: ${String(network)}`);
  }
};
