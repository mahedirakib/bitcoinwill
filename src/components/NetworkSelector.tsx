import { useEffect, useRef, useState } from 'react';
import { useSettings } from '@/state/settings';
import { AlertTriangle, Lock } from 'lucide-react';
import type { BitcoinNetwork } from '@/lib/bitcoin/types';

const CONFIRMATION_PHRASE = "I UNDERSTAND MAINNET IS REAL MONEY";

export const NetworkSelector = () => {
  const { network, setNetwork, isMainnetUnlocked, unlockMainnet } = useSettings();
  const [showModal, setShowModal] = useState(false);
  const [phrase, setPhrase] = useState('');
  const modalRef = useRef<HTMLDivElement | null>(null);
  const phraseInputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const closeModal = () => {
    setShowModal(false);
    setPhrase('');
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as BitcoinNetwork | 'mainnet';
    if (val === 'mainnet' && !isMainnetUnlocked) {
      setShowModal(true);
      return;
    }
    setNetwork(val);
  };

  useEffect(() => {
    if (!showModal) return;

    lastFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => phraseInputRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false);
        setPhrase('');
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      lastFocusedElementRef.current?.focus();
    };
  }, [showModal]);

  const confirmUnlock = () => {
    if (phrase === CONFIRMATION_PHRASE) {
      unlockMainnet();
      setNetwork('mainnet');
      closeModal();
    }
  };

  return (
    <div className="relative inline-block">
      <select 
        value={network}
        onChange={handleSelect}
        aria-label="Select Bitcoin network"
        className={`bg-muted text-[10px] font-black uppercase tracking-[0.15em] py-2 px-4 rounded-full border outline-none appearance-none cursor-pointer pr-10 transition-all ${
          network === 'mainnet' 
            ? 'text-red-700 border-red-600/40 bg-red-100' 
            : 'text-primary border-border hover:border-primary/30'
        }`}
      >
        <option value="testnet">Testnet</option>
        <option value="regtest">Regtest</option>
        <option value="mainnet">Mainnet 🔒</option>
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Lock className="w-3 h-3 opacity-30 text-primary" />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mainnet-warning-title"
            aria-describedby="mainnet-warning-description"
            className="glass max-w-lg w-full p-10 space-y-8 border-red-500/10 shadow-2xl shadow-red-500/10 animate-in zoom-in-95 duration-300"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-red-50 p-5 rounded-[2rem]">
                <AlertTriangle className="text-red-500 w-12 h-12 drop-shadow-sm" />
              </div>
              <div className="space-y-2">
                <h2 id="mainnet-warning-title" className="text-3xl font-black tracking-tight">Serious Risk Ahead</h2>
                <div id="mainnet-warning-description" className="space-y-4 text-base text-foreground/60 font-medium leading-relaxed">
                  <p>Mainnet uses <span className="text-red-600 font-bold">real Bitcoin</span>. A single mistake could result in the permanent loss of your funds.</p>
                  <p>By proceeding, you acknowledge this is a non-custodial tool and you accept all technical risks.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="mainnet-phrase-input" className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
                  Verification Phrase
                </label>
                <div className="p-4 bg-muted rounded-2xl border border-border select-none text-center">
                  <p className="text-xs font-mono text-primary font-bold">
                    {CONFIRMATION_PHRASE}
                  </p>
                </div>
                <input 
                  id="mainnet-phrase-input"
                  ref={phraseInputRef}
                  type="text" 
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  className="w-full bg-muted border border-border p-5 rounded-2xl font-mono text-sm outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 transition-all"
                  placeholder="Type carefully..."
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-4 text-sm font-bold text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                  Go Back
                </button>
                <button 
                  type="button"
                  onClick={confirmUnlock}
                  disabled={phrase !== CONFIRMATION_PHRASE}
                  className="flex-1 bg-red-600 disabled:opacity-20 disabled:grayscale py-4 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-600/20"
                >
                  Unlock Mainnet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
