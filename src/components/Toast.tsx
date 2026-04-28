import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { Check } from 'lucide-react';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const dismissTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
    }
    setMessage(msg);
    dismissTimerRef.current = window.setTimeout(() => {
      setMessage(null);
      dismissTimerRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium shadow-md">
            <Check className="h-3.5 w-3.5 text-success" />
            <span className="text-foreground">{message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
