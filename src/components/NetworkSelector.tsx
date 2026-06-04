import React, { useRef, useState, memo, useCallback } from 'react';
import { useSettings } from '@/state/settings';
import { AlertTriangle } from 'lucide-react';
import type { BitcoinNetwork } from '@/lib/bitcoin/types';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const CONFIRMATION_PHRASE = 'I UNDERSTAND MAINNET IS REAL MONEY';

const NetworkSelectorComponent = () => {
  const { network, setNetwork, isMainnetUnlocked, unlockMainnet } = useSettings();
  const [showModal, setShowModal] = useState(false);
  const [phrase, setPhrase] = useState('');
  const phraseInputRef = useRef<HTMLInputElement | null>(null);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setPhrase('');
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as BitcoinNetwork | 'mainnet';
    if (val === 'mainnet' && !isMainnetUnlocked) {
      setShowModal(true);
      return;
    }
    setNetwork(val);
  };

  const modalRef = useFocusTrap<HTMLDivElement>({
    enabled: showModal,
    onEscape: closeModal,
    initialFocus: () => phraseInputRef.current,
  });

  const confirmUnlock = () => {
    if (phrase === CONFIRMATION_PHRASE) {
      unlockMainnet();
      setNetwork('mainnet');
      closeModal();
    }
  };

  const dot =
    network === 'mainnet'
      ? 'bg-danger'
      : network === 'testnet'
      ? 'bg-success'
      : 'bg-muted-foreground';

  return (
    <div className="relative inline-block">
      <div className="relative">
        <select
          value={network}
          onChange={handleSelect}
          aria-label="Select Bitcoin network"
          className="appearance-none cursor-pointer rounded-md border border-border bg-white py-1.5 pl-6 pr-7 text-xs font-semibold capitalize text-foreground transition-colors hover:border-border-strong focus:border-foreground focus:outline-none"
        >
          <option value="testnet">Testnet</option>
          <option value="regtest">Regtest</option>
          <option value="mainnet">Mainnet</option>
        </select>
        <span
          className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full ${dot}`}
          aria-hidden
        />
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 p-6">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mainnet-warning-title"
            className="panel w-full max-w-md p-6 space-y-5 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-danger/10 p-2 text-danger">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 id="mainnet-warning-title" className="text-base font-semibold">
                  Switch to mainnet?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mainnet uses real Bitcoin. Mistakes can cause permanent loss of funds.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="mainnet-phrase" className="field-label">
                Type the confirmation phrase
              </label>
              <div className="rounded-md bg-muted px-3 py-2 text-center font-mono text-xs">
                {CONFIRMATION_PHRASE}
              </div>
              <input
                id="mainnet-phrase"
                ref={phraseInputRef}
                type="text"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="field-input"
                placeholder="Type carefully…"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmUnlock}
                disabled={phrase !== CONFIRMATION_PHRASE}
                className="btn-danger"
              >
                Switch to mainnet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const NetworkSelector = memo(NetworkSelectorComponent);
