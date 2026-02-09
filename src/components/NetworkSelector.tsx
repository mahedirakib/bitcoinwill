import React, { useState } from 'react';
import { useSettings } from '@/state/settings';
import { AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

const CONFIRMATION_PHRASE = "I UNDERSTAND MAINNET IS REAL MONEY";

export const NetworkSelector = () => {
  const { network, setNetwork, isMainnetUnlocked, unlockMainnet } = useSettings();
  const [showModal, setShowModal] = useState(false);
  const [phrase, setPhrase] = useState('');

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'mainnet' && !isMainnetUnlocked) {
      setShowModal(true);
      return;
    }
    setNetwork(val as any);
  };

  const confirmUnlock = () => {
    if (phrase === CONFIRMATION_PHRASE) {
      unlockMainnet();
      setNetwork('mainnet');
      setShowModal(false);
      setPhrase('');
    }
  };

  return (
    <div className="relative inline-block">
      <select 
        value={network}
        onChange={handleSelect}
        className={`bg-zinc-900 text-xs font-bold py-1 px-3 rounded-full border border-white/10 outline-none appearance-none cursor-pointer pr-8 ${
          network === 'mainnet' ? 'text-red-500 border-red-500/30' : 'text-primary'
        }`}
      >
        <option value="testnet">Network: Testnet</option>
        <option value="regtest">Network: Regtest</option>
        <option value="mainnet">Network: Mainnet (Locked)</option>
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <Lock className="w-3 h-3 opacity-30" />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="glass max-w-md w-full p-8 space-y-6 border-red-500/30">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-red-500/20 p-4 rounded-full">
                <AlertTriangle className="text-red-500 w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold">Unlock Mainnet?</h2>
              <div className="space-y-2 text-sm text-foreground/60">
                <p>Mainnet uses <strong>real Bitcoin</strong>. If you make a mistake, your funds can be lost permanently.</p>
                <p>This tool is still in MVP phase. By unlocking Mainnet, you accept all risks.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-40">
                  Type the following to confirm:
                </label>
                <p className="text-xs font-mono select-none text-primary italic">
                  {CONFIRMATION_PHRASE}
                </p>
                <input 
                  type="text" 
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  className="w-full bg-black border border-white/10 p-3 rounded-lg font-mono text-sm outline-none focus:border-red-500 transition-colors"
                  placeholder="Type carefully..."
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-foreground/40"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmUnlock}
                  disabled={phrase !== CONFIRMATION_PHRASE}
                  className="flex-1 bg-red-600 disabled:opacity-30 disabled:grayscale py-3 rounded-xl text-sm font-bold text-white transition-all"
                >
                  Unlock & Switch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
