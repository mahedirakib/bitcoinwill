import React, { createContext, useContext, useState } from 'react';
import { BitcoinNetwork, isBitcoinNetwork } from '@/lib/bitcoin/types';

interface SettingsContextType {
  network: BitcoinNetwork;
  setNetwork: (network: BitcoinNetwork) => void;
  isMainnetUnlocked: boolean;
  unlockMainnet: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetworkState] = useState<BitcoinNetwork>(() => {
    const saved = localStorage.getItem('bitcoinwill_network');
    if (!isBitcoinNetwork(saved)) return 'testnet';
    // We never persist mainnet
    if (saved === 'mainnet') return 'testnet';
    return saved;
  });

  const [isMainnetUnlocked, setIsMainnetUnlocked] = useState(false);

  const setNetwork = (n: BitcoinNetwork) => {
    if (n === 'mainnet' && !isMainnetUnlocked) return;
    setNetworkState(n);
    if (n !== 'mainnet') {
      localStorage.setItem('bitcoinwill_network', n);
    }
  };

  const unlockMainnet = () => setIsMainnetUnlocked(true);

  return (
    <SettingsContext.Provider value={{ network, setNetwork, isMainnetUnlocked, unlockMainnet }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
