import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface StatusCardProps {
  label: string;
  value: string;
  detail: string;
}

export const StatusCard = ({ label, value, detail }: StatusCardProps) => {
  return (
    <div className="rounded-md border border-border bg-white p-4 space-y-1">
      <p className="section-eyebrow">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>
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
    <div className="space-y-1.5">
      <p className="section-eyebrow print:text-gray-500">{label}</p>
      <div className="flex gap-2">
        <div
          className={`flex-1 break-all rounded-md border border-border bg-muted/40 px-3 py-2 text-sm print:border-none print:bg-transparent print:p-0 ${
            mono ? 'font-mono text-xs' : ''
          }`}
        >
          {value}
        </div>
        {copyable && (
          <button
            type="button"
            aria-label={`Copy ${label}`}
            onClick={handleCopy}
            className="btn-secondary !px-3 !py-2 print:hidden"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
};
