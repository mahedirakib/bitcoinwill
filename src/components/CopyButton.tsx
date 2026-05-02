import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label: string;
  onCopy: (text: string, label: string) => boolean | Promise<boolean> | void;
  className?: string;
  ariaLabel?: string;
}

export const CopyButton = ({ text, label, onCopy, className = '', ariaLabel }: CopyButtonProps) => {
  const [hasCopied, setHasCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    try {
      const didCopy = await onCopy(text, label);
      if (didCopy === false) return;
    } catch {
      return;
    }

    setHasCopied(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setHasCopied(false);
      timerRef.current = null;
    }, 2000);
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel || `Copy ${label}`}
      onClick={handleClick}
      className={className}
    >
      {hasCopied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
};
