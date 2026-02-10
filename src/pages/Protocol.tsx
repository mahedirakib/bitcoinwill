import { ChevronLeft, FileCode, Shield, Zap, AlertCircle, HelpCircle, Clock, CheckCircle, XCircle, Lock } from 'lucide-react';
import diagram from '@/assets/diagram.svg';

const Protocol = ({ onBack, onOpenWhitepaper }: { onBack: () => void; onOpenWhitepaper: () => void }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-16 animate-in fade-in slide-in-from-bottom-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to App
      </button>

      <header className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Protocol Specification</h1>
        <p className="text-xl text-foreground/60">
          A transparent look at how Bitcoin Will works under the hood.
        </p>
      </header>

      {/* TIP Overview Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">What is TIP?</h2>
        </div>
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>TIP stands for <strong>TimeLock Inheritance Protocol</strong>. It is a Bitcoin-native way to plan inheritance using Bitcoin timelocks and spending conditions.</p>
          <p>TIP is not a new blockchain. It is not a token. It is not a company or custody service.</p>
          <p>TIP is a practical pattern for creating a future spending plan that can only be executed after a chosen time, using Bitcoin's existing script capabilities.</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Why TIP exists</h2>
        </div>
        <div className="space-y-4 text-foreground/70 leading-relaxed">
          <p>Bitcoin is unforgiving. If a person dies or becomes unable to access their keys, Bitcoin can be lost forever.</p>
          <p>Most inheritance solutions try to solve this by adding a trusted third party, such as a custodian, an account system, or a company that holds secrets. That introduces new risks.</p>
          <p>TIP exists to provide a trust-minimized option: a way to plan ahead while keeping control in the hands of the Bitcoin owner.</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">How TIP works (high level)</h2>
        </div>
        <div className="space-y-6">
          <p className="text-foreground/70 leading-relaxed">
            TIP uses relative timelocks (CSV) to create a spending path that is not valid until a chosen number of blocks has elapsed since funding confirmation.
          </p>
          
          <div className="glass p-8 space-y-0">
            {[
              {
                num: '1',
                title: 'You choose a timeline and beneficiaries or a recovery plan.',
              },
              {
                num: '2',
                title: 'Bitcoin Will generates a TIP spending plan and script conditions.',
              },
              {
                num: '3',
                title: 'Funds are arranged so they can only be moved according to that plan.',
              },
              {
                num: '4',
                title: 'Before the timelock expires, the future-spend path is not valid.',
              },
              {
                num: '5',
                title: 'After the timelock expires, the future-spend path becomes valid and can be used.',
              },
            ].map((step, i, arr) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{step.num}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-px h-full bg-border my-2" />
                  )}
                </div>
                <div className="pb-8 flex-1">
                  <p className="text-foreground/80 leading-relaxed">{step.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass p-6 border-l-4 border-l-primary">
            <p className="text-foreground/70 leading-relaxed">
              All rules are enforced by the Bitcoin network itself. Bitcoin Will is not trusted.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Specification Section */}
      <section className="space-y-6 pt-8 border-t border-border">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="text-primary w-6 h-6" /> Technical Implementation
        </h2>
        
        <section className="space-y-6">
          <h3 className="text-xl font-bold">Logic Flow</h3>
          <div className="glass p-8 flex justify-center bg-white/5">
            <img src={diagram} alt="Bitcoin Will Logic Diagram" className="max-w-full h-auto" />
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="glass p-6 space-y-4 border-white/5">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileCode className="text-primary w-5 h-5" /> The Script
            </h3>
            <pre className="bg-black/40 p-4 rounded-xl text-[10px] font-mono text-foreground/70 overflow-x-auto leading-relaxed">
{`OP_IF
  <owner_pubkey> OP_CHECKSIG
OP_ELSE
  <locktime_blocks> OP_CHECKSEQUENCEVERIFY
  OP_DROP
  <beneficiary_pubkey> OP_CHECKSIG
OP_ENDIF`}
            </pre>
            <p className="text-xs text-foreground/50 italic">
              Compatible with SegWit P2WSH (v0) outputs.
            </p>
          </section>

          <section className="glass p-6 space-y-4 border-white/5">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Shield className="text-primary w-5 h-5" /> Security Properties
            </h3>
            <ul className="space-y-3 text-sm text-foreground/70">
              <li>• <strong>Non-Custodial:</strong> No private keys are ever requested or generated.</li>
              <li>• <strong>Stateless:</strong> No user data is stored on any server.</li>
              <li>• <strong>Deterministic:</strong> Fixed inputs yield a fixed, auditable output.</li>
            </ul>
          </section>
        </div>
      </section>

      {/* What it does/doesn't do */}
      <div className="grid md:grid-cols-2 gap-8">
        <section className="glass p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold">What Bitcoin Will does</h3>
          </div>
          <ul className="space-y-2 text-sm text-foreground/70">
            {[
              'Generates TIP-compatible Bitcoin scripts and a readable spending plan',
              'Helps users choose time parameters and understand tradeoffs',
              'Runs locally in the browser',
              'Does not require an account',
              'Does not store user data on any server',
              'Does not see private keys',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-xl font-bold">What it does NOT do</h3>
          </div>
          <ul className="space-y-2 text-sm text-foreground/70">
            {[
              'A wallet',
              'A custodian',
              'A legal will',
              'A monitoring service that checks whether someone is alive',
              'A guarantee against user error',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Security Model */}
      <section className="glass p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Security Model</h3>
        </div>
        <div className="space-y-4 text-foreground/70 text-sm">
          <p>Bitcoin Will is designed to minimize trust and data exposure.</p>
          
          <div className="font-semibold text-foreground/90">Core properties:</div>
          <ul className="space-y-2">
            {[
              'No server-side plan storage (session drafts may be cached locally in your browser)',
              'Client-side only',
              'Outputs are inspectable and verifiable',
              'Open-source and reviewable',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Limitations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertCircle className="text-yellow-500 w-6 h-6" /> Key Limitations
        </h2>
        <div className="grid gap-4 text-sm text-foreground/70">
          <p><strong>1. No Monitoring:</strong> The app does not watch the blockchain for you. Your heir must use the Recovery Kit manually.</p>
          <p><strong>2. Not a Legal Will:</strong> This is a technical primitive. It does not replace legal inheritance laws.</p>
          <p><strong>3. Irreversibility:</strong> Bitcoin scripts are final. Test with small amounts on Testnet first.</p>
        </div>
      </section>

      <footer className="pt-8 border-t border-white/5 text-center flex flex-col items-center gap-2">
        <p className="text-xs text-foreground/30">TIP Protocol v1.0.0 • Last Updated Feb 2026</p>
        <button
          type="button"
          onClick={onOpenWhitepaper}
          className="text-xs text-foreground/40 hover:text-primary transition-colors underline underline-offset-4 decoration-white/10"
        >
          Protocol Whitepaper
        </button>
      </footer>
    </div>
  );
};

export default Protocol;
