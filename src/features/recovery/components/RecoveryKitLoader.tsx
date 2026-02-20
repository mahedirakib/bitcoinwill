import { useState } from 'react';
import { ChevronLeft, FileText, Users, Key } from 'lucide-react';
import {
  buildInstructions,
  validateAndNormalizeRecoveryKit,
} from '@/lib/bitcoin/instructions';
import { useToast } from '@/components/Toast';
import type { RecoveryKitLoaderProps } from '../types';

interface ExtendedRecoveryKitLoaderProps extends RecoveryKitLoaderProps {
  onSocialRecovery?: () => void;
}

export const RecoveryKitLoader = ({ onLoad, onBack, onSocialRecovery }: ExtendedRecoveryKitLoaderProps) => {
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
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <FileText className="w-16 h-16 text-primary relative" />
        </div>
        <h1 className="text-3xl font-bold">Recovery Options</h1>
        <p className="text-foreground/70">Choose how you want to access the vault.</p>
      </div>

      <div className="grid gap-4">
        <div className="p-6 rounded-2xl border border-border bg-muted/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">I have the Recovery Kit</h3>
              <p className="text-sm text-foreground/60">Paste your JSON recovery kit file</p>
            </div>
          </div>
          
          <label htmlFor="recovery-kit-json" className="sr-only">Recovery kit JSON</label>
          <textarea
            id="recovery-kit-json"
            className="w-full h-32 bg-background border border-border rounded-xl p-4 font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder='{"version": "0.1.0", "plan": {...}, "result": {...}}'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
          <button 
            type="button"
            onClick={handleJsonUpload}
            disabled={!jsonInput.trim()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Load Instructions
          </button>
        </div>

        {onSocialRecovery && (
          <div className="p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Users className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold">I have Social Recovery Shares</h3>
                <p className="text-sm text-foreground/60">Combine shares to reconstruct the private key</p>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={onSocialRecovery}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
            >
              Start Share Recovery
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
