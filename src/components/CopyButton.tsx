import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label: string;
  onCopy: (text: string, label: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const CopyButton = ({ text, label, onCopy, className = '', ariaLabel }: CopyButtonProps) => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleClick = () => {
    onCopy(text, label);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel || `Copy ${label}`}
      onClick={handleClick}
      className={className}
    >
      {hasCopied ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <Copy className="w-5 h-5" />
      )}
    </button>
  );
};
