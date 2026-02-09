import { useState, useEffect } from 'react';
import { buildPlan } from '@/lib/bitcoin/planEngine';
import { PlanInput, PlanOutput } from '@/lib/bitcoin/types';

const DevPlayground = () => {
  const [input, setInput] = useState<PlanInput>({
    network: 'testnet',
    inheritance_type: 'timelock_recovery',
    owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
    beneficiary_pubkey: '03a634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
    locktime_blocks: 144, // ~1 day
  });

  const [output, setOutput] = useState<PlanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const result = buildPlan(input);
      setOutput(result);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setOutput(null);
    }
  }, [input]);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold font-mono">🛠 Bitcoin Will - Dev Playground</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Plan Input (Live JSON Edit)</h2>
          <textarea 
            className="w-full h-64 p-4 bg-zinc-900 border border-white/10 rounded-xl font-mono text-sm"
            value={JSON.stringify(input, null, 2)}
            onChange={(e) => {
              try {
                setInput(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON - don't update
              }
            }}
          />
          {error && <div className="p-4 bg-red-500/20 text-red-400 rounded-lg">{error}</div>}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Plan Output</h2>
          {output && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-xs uppercase font-bold text-primary mb-1">Generated Address</p>
                <p className="font-mono break-all">{output.address}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-bold">Human Explanation:</p>
                <ul className="list-disc list-inside text-sm text-foreground/70 space-y-1">
                  {output.human_explanation.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold">Script ASM:</p>
                <pre className="p-3 bg-zinc-900 rounded-lg text-xs overflow-x-auto">
                  {output.script_asm}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-white/10">
        <h2 className="text-xl font-bold mb-4">Raw Output Object</h2>
        <pre className="p-4 bg-zinc-900 border border-white/10 rounded-xl font-mono text-xs overflow-x-auto">
          {JSON.stringify(output, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DevPlayground;
