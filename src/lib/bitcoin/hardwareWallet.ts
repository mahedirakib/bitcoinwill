import { Buffer } from 'buffer';
import * as ecc from 'tiny-secp256k1';
import type { BitcoinNetwork } from './types';
import { bytesToHex } from './hex';
import { validatePubkey } from './validation';

export type HardwareWalletType = 'trezor' | 'ledger' | 'coldcard';

export interface HardwareWalletInfo {
  type: HardwareWalletType;
  label: string;
  description: string;
  supported: boolean;
}

export interface WalletPublicKey {
  publicKey: string;
  path: string;
  fingerprint?: string;
}

export const SUPPORTED_WALLETS: HardwareWalletInfo[] = [
  {
    type: 'trezor',
    label: 'Trezor',
    description: 'Model T, Model One',
    supported: true,
  },
  {
    type: 'ledger',
    label: 'Ledger',
    description: 'Nano S Plus, Nano X',
    supported: true,
  },
  {
    type: 'coldcard',
    label: 'Coldcard',
    description: 'Mk4, Q (USB or QR)',
    supported: false, // QR-only for now
  },
];

/**
 * Check if WebHID is supported (required for Ledger, newer Trezor)
 */
const getCoinType = (network: BitcoinNetwork): number => {
  switch (network) {
    case 'mainnet':
      return 0;
    case 'testnet':
    case 'regtest':
      return 1;
    default:
      return 0;
  }
};

const getDerivationPath = (network: BitcoinNetwork, account: number = 0): string => {
  const coinType = getCoinType(network);
  return `84'/${coinType}'/${account}'/0/0`;
};

export const isWebHidSupported = (): boolean => {
  return typeof window !== 'undefined' && 'hid' in navigator;
};

/**
 * Check if WebUSB is supported (fallback for Trezor)
 */
export const isWebUsbSupported = (): boolean => {
  return typeof window !== 'undefined' && 'usb' in navigator;
};

const LEDGER_BECH32_FORMAT = 2;

interface LedgerTransportLike {
  send: (
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data?: Buffer,
    statusList?: number[],
    options?: { abortTimeoutMs?: number },
  ) => Promise<Buffer>;
}

const encodeBip32Path = (path: string): Buffer => {
  const segments = path.split('/').filter(Boolean);
  const encodedPath = Buffer.alloc(1 + segments.length * 4);

  encodedPath[0] = segments.length;

  segments.forEach((segment, index) => {
    const isHardened = segment.endsWith("'");
    const normalizedSegment = isHardened ? segment.slice(0, -1) : segment;

    if (!/^\d+$/.test(normalizedSegment)) {
      throw new Error(`Invalid derivation path segment: ${segment}`);
    }

    const value = Number.parseInt(normalizedSegment, 10);
    if (!Number.isSafeInteger(value) || value < 0 || value >= 0x80000000) {
      throw new Error(`Invalid derivation path index: ${segment}`);
    }

    encodedPath.writeUInt32BE(isHardened ? value + 0x80000000 : value, 1 + index * 4);
  });

  return encodedPath;
};

// Ledger's GET_WALLET_PUBLIC_KEY APDU returns the SEC1 uncompressed (65-byte)
// form. Compress it so downstream validation (which requires 33-byte 02/03
// compressed keys) accepts it.
export const parseLedgerPublicKeyResponse = (response: Uint8Array): string => {
  if (response.length === 0) {
    throw new Error('Invalid Ledger response: missing public key length');
  }

  const publicKeyLength = response[0];
  const pubkeyEnd = 1 + publicKeyLength;
  if (response.length < pubkeyEnd) {
    throw new Error('Invalid Ledger response: truncated public key');
  }

  let pubkeyBytes: Uint8Array = response.slice(1, pubkeyEnd);

  if (pubkeyBytes.length === 65 && pubkeyBytes[0] === 0x04) {
    pubkeyBytes = ecc.pointCompress(pubkeyBytes, true);
  }

  return formatPublicKey(bytesToHex(pubkeyBytes));
};

const getLedgerWalletPublicKey = async (
  transport: LedgerTransportLike,
  path: string,
): Promise<WalletPublicKey> => {
  const response = await transport.send(
    0xe0,
    0x40,
    0x00,
    LEDGER_BECH32_FORMAT,
    encodeBip32Path(path),
  );

  return {
    publicKey: parseLedgerPublicKeyResponse(response),
    path: `m/${path}`,
  };
};

export const connectTrezor = async (
  network: BitcoinNetwork = 'mainnet'
): Promise<WalletPublicKey> => {
  const TrezorConnect = (await import('@trezor/connect-web/lib/module/index.js')).default;
  const path = getDerivationPath(network);

  await TrezorConnect.init({
    lazyLoad: true,
    manifest: {
      appName: 'Bitcoin Will',
      email: 'maintainer@bitcoinwill.local',
      appUrl: window.location.origin,
    },
  });

  const result = await TrezorConnect.getPublicKey({
    path,
    coin: network === 'mainnet' ? 'btc' : 'testnet',
  });

  if (!result.success) {
    const errorMessage = result.payload.error || 'Failed to connect to Trezor';
    const actionableError = new Error(
      `${errorMessage}\n\n` +
      'Troubleshooting steps:\n' +
      '1. Ensure your Trezor is connected via USB and unlocked\n' +
      '2. Try a different USB cable or port\n' +
      '3. Close any other wallet apps that might be using the device\n' +
      '4. Use Chrome or Edge browser (Firefox has limited WebUSB support)\n' +
      '5. Check that your device firmware is up to date'
    );
    throw actionableError;
  }

  return {
    publicKey: formatPublicKey(result.payload.publicKey),
    path: result.payload.serializedPath,
    fingerprint: result.payload.fingerprint?.toString(16),
  };
};

/**
 * Connect to Ledger and get public key
 */
export const connectLedger = async (
  network: BitcoinNetwork = 'mainnet'
): Promise<WalletPublicKey> => {
  if (!isWebHidSupported()) {
    throw new Error(
      'WebHID not supported in this browser.\n\n' +
      'To use hardware wallets:\n' +
      '1. Use Chrome, Edge, or Brave browser\n' +
      '2. Ensure your browser is up to date\n' +
      '3. Firefox and Safari do not support WebHID required for hardware wallets'
    );
  }

  const transportModule = await import('@ledgerhq/hw-transport-webhid');

  const TransportWebHID = transportModule.default;

  const transport = await TransportWebHID.create();
  const path = getDerivationPath(network);

  try {
    return await getLedgerWalletPublicKey(transport, path);
  } finally {
    try {
      await transport.close();
    } catch {
      // Ignore close errors to avoid masking the original error
    }
  }
};

/**
 * Connect to hardware wallet based on type
 */
export const connectHardwareWallet = async (
  type: HardwareWalletType,
  network: BitcoinNetwork = 'mainnet'
): Promise<WalletPublicKey> => {
  switch (type) {
    case 'trezor':
      return connectTrezor(network);
    case 'ledger':
      return connectLedger(network);
    case 'coldcard':
      throw new Error('Coldcard USB support coming soon. Use QR code scan instead.');
    default:
      throw new Error(`Unsupported wallet type: ${type}`);
  }
};

/**
 * Format public key for display
 */
export const formatPublicKey = (pubkey: string): string => {
  const normalized = pubkey.trim().toLowerCase();
  if (!validatePubkey(normalized)) {
    throw new Error('Invalid public key format from hardware wallet');
  }
  return normalized;
};
