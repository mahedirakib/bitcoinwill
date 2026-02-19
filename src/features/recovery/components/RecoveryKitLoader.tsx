import { useState } from 'react';
import { ChevronLeft, FileText } from 'lucide-react';
import {
  buildInstructions,
  validateAndNormalizeRecoveryKit,
} from '@/lib/bitcoin/instructions';
import { useToast } from '@/components/Toast';
import type { RecoveryKitLoaderProps } from '../types';

export const RecoveryKitLoader = ({ onLoad, onBack }: RecoveryKitLoaderProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const { showToast } = useToast();

  const handleJsonUpload = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = validateAndNormalizeRecoveryKit(parsed);
      const model = buildInstructions(normalized.plan, normalized.result, normalized.created_at);
      onLoad(model);
      showToast("Instructions Loaded Successfully");
    } catch (error) {
      const message = (error as Error).message;
      showToast(message || "Error parsing JSON");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-6 space-y-8 animate-in fade-in">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-foreground/60 hover:text-primary">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="text-center space-y-4">
        <FileText className="w-16 h-16 text-primary/20 mx-auto" />
        <h1 className="text-3xl font-bold">View Beneficiary Instructions</h1>
        <p className="text-foreground/70">Paste your Recovery Kit JSON below to view the claim instructions.</p>
      </div>
      <label htmlFor="recovery-kit-json" className="sr-only">Recovery kit JSON</label>
      <textarea
        id="recovery-kit-json"
        className="w-full h-48 bg-muted border border-border rounded-xl p-4 font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all"
        placeholder='{"version": "0.1.0", "plan": {...}, "result": {...}}'
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
      />
      <button 
        type="button"
        onClick={handleJsonUpload}
        className="btn-primary w-full"
      >
        Load Instructions
      </button>
    </div>
  );
};
