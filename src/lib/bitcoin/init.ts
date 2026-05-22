import { initEccLib } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';

// Initialize ECC library once for bitcoinjs-lib.
// This module should be imported before any bitcoinjs-lib usage.
initEccLib(ecc);
