import { networks, Network } from 'bitcoinjs-lib';
import { BitcoinNetwork } from './types';

export const getNetworkParams = (network: BitcoinNetwork): Network => {
  switch (network) {
    case 'regtest':
      return networks.regtest;
    case 'testnet':
    default:
      return networks.testnet;
  }
};
