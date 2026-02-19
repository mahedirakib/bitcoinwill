import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface StatusCardProps {
  label: string;
  value: string;
  detail: string;
}

export const StatusCard = ({ label, value, detail }: StatusCardProps) => {
  return (
    <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-xs text-foreground/65 leading-relaxed">{detail}</p>
    </div>
  );
};

interface DataRowProps {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}

export const DataRow = ({ label, value, copyable, mono }: DataRowProps) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 print:text-gray-500">{label}</p>
      <div className="flex gap-2">
        <div className={`flex-1 p-3 bg-muted border border-border rounded-lg text-sm break-all print:bg-transparent print:border-none print:p-0 ${mono ? 'font-mono text-[11px]' : ''}`}>
          {value}
        </div>
        {copyable && (
          <button 
            type="button"
            aria-label={`Copy ${label}`}
            onClick={handleCopy}
            className="p-3 bg-white border border-border rounded-lg hover:bg-muted transition-colors print:hidden"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 opacity-40" />}
          </button>
        )}
      </div>
    </div>
  );
};
