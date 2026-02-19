/**
 * Hardware Wallet Integration Module
 * 
 * Supports USB/QR connection to major hardware wallets:
 * - Trezor (Model T, One) via WebUSB/WebHID
 * - Ledger (Nano S, S Plus, X) via WebHID
 * - Coldcard (Mk4, Q) via USB or QR (xpub export)
 * 
 * @module hardwareWallet
 */

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
export const isWebHidSupported = (): boolean => {
  return typeof window !== 'undefined' && 'hid' in navigator;
};

/**
 * Check if WebUSB is supported (fallback for Trezor)
 */
export const isWebUsbSupported = (): boolean => {
  return typeof window !== 'undefined' && 'usb' in navigator;
};

/**
 * Connect to Trezor and get public key
 */
export const connectTrezor = async (
  path: string = "m/84'/0'/0'/0/0"
): Promise<WalletPublicKey> => {
  // Dynamically import Trezor Connect to avoid SSR issues
  const TrezorConnect = (await import('@trezor/connect-web')).default;
  
  await TrezorConnect.init({
    lazyLoad: true,
    manifest: {
      appName: 'Bitcoin Will',
      email: 'github.com/mahedirakib/bitcoinwill',
      appUrl: 'https://github.com/mahedirakib/bitcoinwill',
    },
  });

  const result = await TrezorConnect.getPublicKey({
    path,
    coin: 'btc',
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
    publicKey: result.payload.publicKey,
    path: result.payload.serializedPath,
    fingerprint: result.payload.fingerprint?.toString(16),
  };
};

/**
 * Connect to Ledger and get public key
 */
export const connectLedger = async (): Promise<WalletPublicKey> => {
  if (!isWebHidSupported()) {
    throw new Error(
      'WebHID not supported in this browser.\n\n' +
      'To use hardware wallets:\n' +
      '1. Use Chrome, Edge, or Brave browser\n' +
      '2. Ensure your browser is up to date\n' +
      '3. Firefox and Safari do not support WebHID required for hardware wallets'
    );
  }

  // Dynamically import Ledger libraries
  const TransportWebHID = (await import('@ledgerhq/hw-transport-webhid')).default;
  const Btc = (await import('@ledgerhq/hw-app-btc')).default;

  const transport = await TransportWebHID.create();
  
  try {
    const app = new Btc({ transport });
    
    // Get wallet public key for native segwit path
    const result = await app.getWalletPublicKey("84'/0'/0'/0/0", { 
      format: 'bech32' 
    });

    return {
      publicKey: result.publicKey,
      path: "m/84'/0'/0'/0/0",
    };
  } finally {
    await transport.close();
  }
};

/**
 * Connect to hardware wallet based on type
 */
export const connectHardwareWallet = async (
  type: HardwareWalletType
): Promise<WalletPublicKey> => {
  switch (type) {
    case 'trezor':
      return connectTrezor();
    case 'ledger':
      return connectLedger();
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
  // Ensure it starts with 02 or 03 and is 66 chars
  if (pubkey.length !== 66 || !/^(02|03)/.test(pubkey)) {
    throw new Error('Invalid public key format from hardware wallet');
  }
  return pubkey;
};
