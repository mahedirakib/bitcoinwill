import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import { BitcoinNetwork, isBitcoinNetwork } from '@/lib/bitcoin/types';

// The exact phrase a user must type to unlock mainnet. Shared by every entry
// point that performs this dangerous action so the requirement can't drift.
export const MAINNET_CONFIRMATION_PHRASE = 'I UNDERSTAND MAINNET IS REAL MONEY';

interface SettingsContextType {
  network: BitcoinNetwork;
  setNetwork: (network: BitcoinNetwork) => void;
  isMainnetUnlocked: boolean;
  unlockMainnet: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetworkState] = useState<BitcoinNetwork>(() => {
    try {
      const saved = localStorage.getItem('bitcoinwill_network');
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

  const setNetwork = useCallback((n: BitcoinNetwork) => {
    if (n === 'mainnet' && !isMainnetUnlockedRef.current) return;
    setNetworkState(n);
    if (n !== 'mainnet') {
      try {
        localStorage.setItem('bitcoinwill_network', n);
      } catch {
        // Ignore storage errors in restricted browser contexts.
      }
    }
  }, []);

  const unlockMainnet = useCallback(() => {
    isMainnetUnlockedRef.current = true;
    setIsMainnetUnlocked(true);
  }, []);

  const value = useMemo(
    () => ({ network, setNetwork, isMainnetUnlocked, unlockMainnet }),
    [network, setNetwork, isMainnetUnlocked, unlockMainnet]
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
