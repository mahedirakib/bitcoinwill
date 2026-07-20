import React, { createContext, useContext, useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { BitcoinNetwork, isBitcoinNetwork } from '@/lib/bitcoin/types';
import {
  clearAllVaults,
  setVaultPersistenceEnabled,
} from '@/lib/vaultStorage';

// The exact phrase a user must type to unlock mainnet. Shared by every entry
// point that performs this dangerous action so the requirement can't drift.
export const MAINNET_CONFIRMATION_PHRASE = 'I UNDERSTAND MAINNET IS REAL MONEY';

export const EPHEMERAL_MODE_KEY = 'bitcoinwill_ephemeral_mode';
export const NETWORK_STORAGE_KEY = 'bitcoinwill_network';

const readEphemeralMode = (): boolean => {
  try {
    return localStorage.getItem(EPHEMERAL_MODE_KEY) === '1';
  } catch {
    return false;
  }
};

interface SettingsContextType {
  network: BitcoinNetwork;
  setNetwork: (network: BitcoinNetwork) => void;
  isMainnetUnlocked: boolean;
  unlockMainnet: () => void;
  ephemeralMode: boolean;
  setEphemeralMode: (enabled: boolean) => boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetworkState] = useState<BitcoinNetwork>(() => {
    try {
      const saved = localStorage.getItem(NETWORK_STORAGE_KEY);
      if (!isBitcoinNetwork(saved)) return 'testnet';
      // We never persist mainnet
      if (saved === 'mainnet') return 'testnet';
      return saved;
    } catch {
      return 'testnet';
    }
  });

  const [isMainnetUnlocked, setIsMainnetUnlocked] = useState(false);
  const isMainnetUnlockedRef = useRef(false);
  const [ephemeralMode, setEphemeralModeState] = useState<boolean>(() => {
    const enabled = readEphemeralMode();
    // Apply before first child render so vault reads honor the preference.
    setVaultPersistenceEnabled(!enabled);
    return enabled;
  });

  useEffect(() => {
    setVaultPersistenceEnabled(!ephemeralMode);
  }, [ephemeralMode]);

  const setNetwork = useCallback((n: BitcoinNetwork) => {
    if (n === 'mainnet' && !isMainnetUnlockedRef.current) return;
    setNetworkState(n);
    if (n !== 'mainnet') {
      try {
        localStorage.setItem(NETWORK_STORAGE_KEY, n);
      } catch {
        // Ignore storage errors in restricted browser contexts.
      }
    }
  }, []);

  const unlockMainnet = useCallback(() => {
    isMainnetUnlockedRef.current = true;
    setIsMainnetUnlocked(true);
  }, []);

  const setEphemeralMode = useCallback((enabled: boolean): boolean => {
    if (enabled) {
      // Wipe device vault list so enabling mode does not leave residual data.
      if (!clearAllVaults()) {
        return false;
      }
    }

    try {
      if (enabled) {
        localStorage.setItem(EPHEMERAL_MODE_KEY, '1');
      } else {
        localStorage.removeItem(EPHEMERAL_MODE_KEY);
      }
    } catch {
      return false;
    }

    setVaultPersistenceEnabled(!enabled);
    setEphemeralModeState(enabled);
    return true;
  }, []);

  const value = useMemo(
    () => ({
      network,
      setNetwork,
      isMainnetUnlocked,
      unlockMainnet,
      ephemeralMode,
      setEphemeralMode,
    }),
    [network, setNetwork, isMainnetUnlocked, unlockMainnet, ephemeralMode, setEphemeralMode]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
