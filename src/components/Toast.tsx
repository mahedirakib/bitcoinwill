import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Check } from 'lucide-react';

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="glass px-6 py-3 border-primary/30 flex items-center gap-3 text-sm font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(247,147,26,0.1)]">
            <div className="bg-primary/20 p-1 rounded-full">
              <Check className="text-primary w-4 h-4" />
            </div>
            {message}
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
