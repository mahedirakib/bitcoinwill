import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, ReactNode } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const VARIANT_CONFIG: Record<ToastVariant, { Icon: React.ComponentType<{ className?: string }>; accent: string; durationMs: number; role: 'status' | 'alert' }> = {
  success: { Icon: Check, accent: 'text-success', durationMs: 2000, role: 'status' },
  error: { Icon: AlertCircle, accent: 'text-danger', durationMs: 5000, role: 'alert' },
  info: { Icon: Info, accent: 'text-foreground', durationMs: 3000, role: 'status' },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const dismissTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
    }
    setToast({ message, variant });
    const { durationMs } = VARIANT_CONFIG[variant];
    dismissTimerRef.current = window.setTimeout(() => {
      setToast(null);
      dismissTimerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  // Memoize the context value so consumers of `useToast` don't re-render every
  // time a toast is shown or dismissed. Without this, every setToast creates a
  // new value object, re-rendering all consumers — which in turn tears down and
  // rebuilds any active focus trap whose options aren't referentially stable.
  const value = useMemo(() => ({ showToast }), [showToast]);

  const config = toast ? VARIANT_CONFIG[toast.variant] : VARIANT_CONFIG.success;
  const Icon = config.Icon;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role={config.role}
          aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
          aria-atomic="true"
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium shadow-md">
            <Icon className={`h-3.5 w-3.5 ${config.accent}`} />
            <span className="text-foreground">{toast.message}</span>
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
